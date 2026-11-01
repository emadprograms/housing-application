using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Dapper;
using FileOrganizer.Web.Models;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Memory;
using Microsoft.Extensions.Logging;

namespace FileOrganizer.Web.Data;

public interface IStoragePathSettingsService
{
    string AreasRootPath { get; }
    string OrganizerDbPath { get; }
    string SettingsFilePath { get; }
    string Source { get; }

    string ResolveAreasRoot(IConfiguration? config = null);
    Task<StoragePathsResponseDto> GetCurrentSettingsAsync(IFileOrganizerRepository repo);
    Task<ValidateStoragePathsResponseDto> ValidatePathsAsync(string? areasRootInput, string? dbPathInput, bool allowMissing = false);
    Task<(bool Success, string? ErrorMessage, StoragePathsResponseDto? Settings)> UpdatePathsAsync(
        UpdateStoragePathsRequestDto request,
        IFileOrganizerRepository repo);
    BrowsePathsResponseDto BrowseServerFilesystem(string? targetPath, bool includeDbFiles = true);
}

public class StoragePathSettingsService : IStoragePathSettingsService
{
    private static readonly byte[] SqliteMagicHeader = Encoding.ASCII.GetBytes("SQLite format 3\0");

    private readonly object _sync = new();
    private readonly ISqliteDbConnectionFactory _connectionFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StoragePathSettingsService>? _logger;
    private readonly string _settingsFilePath;

    private string _areasRootPath;
    private string _organizerDbPath;
    private string _source;

    private sealed class PersistedPathsConfig
    {
        [JsonPropertyName("areas_root_path")]
        public string? AreasRootPath { get; set; }

        [JsonPropertyName("organizer_db_path")]
        public string? OrganizerDbPath { get; set; }

        [JsonPropertyName("updated_at")]
        public string? UpdatedAt { get; set; }
    }

    public string AreasRootPath
    {
        get
        {
            lock (_sync)
            {
                return _areasRootPath;
            }
        }
    }

    public string OrganizerDbPath
    {
        get
        {
            lock (_sync)
            {
                return _organizerDbPath;
            }
        }
    }

    public string SettingsFilePath => _settingsFilePath;

    public string Source
    {
        get
        {
            lock (_sync)
            {
                return _source;
            }
        }
    }

    public StoragePathSettingsService(
        ISqliteDbConnectionFactory connectionFactory,
        IConfiguration configuration,
        ILogger<StoragePathSettingsService>? logger = null)
    {
        _connectionFactory = connectionFactory;
        _configuration = configuration;
        _logger = logger;

        var hasInMemoryTestOverride = HasInMemoryPathOverride(configuration);
        var explicitSettingsFile = configuration["STORAGE_SETTINGS_FILE_PATH"];

        if (!string.IsNullOrWhiteSpace(explicitSettingsFile))
        {
            _settingsFilePath = Path.GetFullPath(explicitSettingsFile.Trim().Trim('"', '\''));
        }
        else if (hasInMemoryTestOverride)
        {
            // Keep xUnit WebApplicationFactory tests completely isolated from repo config.paths.json
            _settingsFilePath = Path.Combine(
                Path.GetTempPath(),
                $"housing_test_paths_{Guid.NewGuid():N}.json");
        }
        else
        {
            _settingsFilePath = DiscoverDefaultSettingsFilePath();
        }

        _areasRootPath = ResolveInitialAreasRoot(configuration);
        _organizerDbPath = _connectionFactory.DatabasePath;
        _source = "configuration";

        // Load persisted config.paths.json when not overridden by in-memory test config
        // (or when a test explicitly configured STORAGE_SETTINGS_FILE_PATH)
        if ((!hasInMemoryTestOverride || !string.IsNullOrWhiteSpace(explicitSettingsFile)) &&
            File.Exists(_settingsFilePath))
        {
            TryLoadPersistedPaths();
        }
    }

    private static bool HasInMemoryPathOverride(IConfiguration configuration)
    {
        if (configuration is not IConfigurationRoot root)
            return false;

        foreach (var provider in root.Providers)
        {
            if (provider is MemoryConfigurationProvider &&
                (provider.TryGet("AREAS_ROOT_PATH", out _) || provider.TryGet("ORGANIZER_DB_PATH", out _)))
            {
                return true;
            }
        }

        return false;
    }

    private static string DiscoverDefaultSettingsFilePath()
    {
        var searchSeeds = new[]
        {
            Directory.GetCurrentDirectory(),
            AppContext.BaseDirectory
        };

        // 1. Existing config.paths.json in ancestor chain
        foreach (var seed in searchSeeds)
        {
            var dir = SafeGetDirectoryInfo(seed);
            for (int depth = 0; depth < 6 && dir != null; depth++, dir = dir.Parent)
            {
                var candidate = Path.Combine(dir.FullName, "config.paths.json");
                if (File.Exists(candidate))
                    return candidate;
            }
        }

        // 2. Repository root marker (HousingApplication.sln or scripts/run-windows.ps1)
        foreach (var seed in searchSeeds)
        {
            var dir = SafeGetDirectoryInfo(seed);
            for (int depth = 0; depth < 6 && dir != null; depth++, dir = dir.Parent)
            {
                if (File.Exists(Path.Combine(dir.FullName, "HousingApplication.sln")) ||
                    File.Exists(Path.Combine(dir.FullName, "scripts", "run-windows.ps1")))
                {
                    return Path.Combine(dir.FullName, "config.paths.json");
                }
            }
        }

        return Path.Combine(AppContext.BaseDirectory, "config.paths.json");
    }

    private static DirectoryInfo? SafeGetDirectoryInfo(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return null;
        try
        {
            return new DirectoryInfo(Path.GetFullPath(path));
        }
        catch
        {
            return null;
        }
    }

    private void TryLoadPersistedPaths()
    {
        try
        {
            var rawJson = File.ReadAllText(_settingsFilePath);
            if (string.IsNullOrWhiteSpace(rawJson))
                return;

            var persisted = JsonSerializer.Deserialize<PersistedPathsConfig>(rawJson);
            if (persisted == null)
                return;

            var updatedAny = false;

            if (!string.IsNullOrWhiteSpace(persisted.AreasRootPath))
            {
                var cleanAreas = CleanPathInput(persisted.AreasRootPath);
                if (!string.IsNullOrWhiteSpace(cleanAreas))
                {
                    _areasRootPath = Path.GetFullPath(cleanAreas);
                    updatedAny = true;
                }
            }

            if (!string.IsNullOrWhiteSpace(persisted.OrganizerDbPath))
            {
                var cleanDb = NormalizeDbPath(persisted.OrganizerDbPath, _areasRootPath);
                if (!string.IsNullOrWhiteSpace(cleanDb))
                {
                    _organizerDbPath = cleanDb;
                    _connectionFactory.UpdateDatabasePath(_organizerDbPath, createParentDirectory: true);
                    updatedAny = true;
                }
            }

            if (updatedAny)
            {
                _source = "config.paths.json";
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to read persisted storage paths from {SettingsFile}", _settingsFilePath);
        }
    }

    private static string ResolveInitialAreasRoot(IConfiguration? config)
    {
        var explicitRoot = config?["AREAS_ROOT_PATH"]
            ?? config?["AREAS_ROOT"]
            ?? config?["areas_root"]
            ?? config?["areas_root_path"]
            ?? Environment.GetEnvironmentVariable("AREAS_ROOT_PATH")
            ?? Environment.GetEnvironmentVariable("AREAS_ROOT");

        if (!string.IsNullOrWhiteSpace(explicitRoot))
        {
            var cleaned = CleanPathInput(explicitRoot);
            if (Path.IsPathRooted(cleaned))
                return Path.GetFullPath(cleaned);

            var cwdPath = Path.GetFullPath(cleaned);
            if (Directory.Exists(cwdPath))
                return cwdPath;

            try
            {
                var baseDirPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, cleaned));
                if (Directory.Exists(baseDirPath))
                    return baseDirPath;
            }
            catch
            {
                // Ignore fallback failure
            }

            if (Directory.Exists(@"D:\areas_v11"))
                return @"D:\areas_v11";

            return cwdPath;
        }

        if (Directory.Exists(@"D:\areas_v11"))
            return @"D:\areas_v11";

        var defaultPath = Path.GetFullPath("../areas");
        return Directory.Exists(defaultPath) ? defaultPath : Directory.GetCurrentDirectory();
    }

    public string ResolveAreasRoot(IConfiguration? config = null)
    {
        string current;
        lock (_sync)
        {
            current = _areasRootPath;
        }

        if (!string.IsNullOrWhiteSpace(current))
            return current;

        return ResolveInitialAreasRoot(config ?? _configuration);
    }

    private static string CleanPathInput(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        return input.Trim().Trim('"', '\'').Trim();
    }

    private static string NormalizeDbPath(string? rawDbInput, string fallbackAreasRoot)
    {
        var cleaned = CleanPathInput(rawDbInput);
        if (string.IsNullOrWhiteSpace(cleaned))
        {
            return string.IsNullOrWhiteSpace(fallbackAreasRoot)
                ? Path.GetFullPath("organizer.db")
                : Path.Combine(fallbackAreasRoot, "organizer.db");
        }

        if (cleaned.Equals(":memory:", StringComparison.OrdinalIgnoreCase) ||
            cleaned.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
        {
            return cleaned;
        }

        if (Directory.Exists(cleaned) ||
            cleaned.EndsWith(Path.DirectorySeparatorChar) ||
            cleaned.EndsWith(Path.AltDirectorySeparatorChar))
        {
            return Path.GetFullPath(Path.Combine(cleaned, "organizer.db"));
        }

        return Path.GetFullPath(cleaned);
    }

    public async Task<StoragePathsResponseDto> GetCurrentSettingsAsync(IFileOrganizerRepository repo)
    {
        var areasPath = AreasRootPath;
        var dbPath = _connectionFactory.DatabasePath;

        var areasExists = !string.IsNullOrWhiteSpace(areasPath) && Directory.Exists(areasPath);
        var (areaDirCount, _) = InspectAreasDirectory(areasPath);

        var dbExists = !string.IsNullOrWhiteSpace(dbPath) && File.Exists(dbPath);
        long dbSize = 0;
        if (dbExists)
        {
            try
            {
                dbSize = new FileInfo(dbPath).Length;
            }
            catch
            {
                dbSize = 0;
            }
        }

        Dictionary<string, int> tables = new();
        if (dbExists)
        {
            try
            {
                var dbInfo = await repo.GetDbStatsAsync();
                tables = dbInfo?.Tables ?? new Dictionary<string, int>();
            }
            catch
            {
                tables = new Dictionary<string, int>();
            }
        }

        return new StoragePathsResponseDto
        {
            AreasRootPath = areasPath,
            AreasRootExists = areasExists,
            AreaDirectoryCount = areaDirCount,
            OrganizerDbPath = dbPath,
            OrganizerDbExists = dbExists,
            OrganizerDbSizeBytes = dbSize,
            SettingsFilePath = _settingsFilePath,
            Source = Source,
            Tables = tables
        };
    }

    public async Task<ValidateStoragePathsResponseDto> ValidatePathsAsync(
        string? areasRootInput,
        string? dbPathInput,
        bool allowMissing = false)
    {
        var warnings = new List<string>();
        var rawAreas = CleanPathInput(areasRootInput);

        if (string.IsNullOrWhiteSpace(rawAreas))
        {
            return new ValidateStoragePathsResponseDto
            {
                Valid = false,
                Message = "Areas folder path is required."
            };
        }

        if (rawAreas.IndexOf('\0') >= 0 || (dbPathInput != null && dbPathInput.IndexOf('\0') >= 0))
        {
            return new ValidateStoragePathsResponseDto
            {
                Valid = false,
                Message = "Path contains invalid characters."
            };
        }

        string normalizedAreas;
        string normalizedDb;
        try
        {
            normalizedAreas = Path.GetFullPath(rawAreas);
            normalizedDb = NormalizeDbPath(dbPathInput, normalizedAreas);
        }
        catch (Exception ex)
        {
            return new ValidateStoragePathsResponseDto
            {
                Valid = false,
                Message = $"Invalid path format: {ex.Message}"
            };
        }

        if (File.Exists(normalizedAreas))
        {
            return new ValidateStoragePathsResponseDto
            {
                Valid = false,
                AreasRootPath = normalizedAreas,
                OrganizerDbPath = normalizedDb,
                Message = "Areas folder path points to a file instead of a directory."
            };
        }

        var areasExists = Directory.Exists(normalizedAreas);
        var (areaCount, sampleAreas) = InspectAreasDirectory(normalizedAreas);

        var dbExists = File.Exists(normalizedDb);
        long dbSize = 0;
        var isValidSqlite = false;
        var tables = new Dictionary<string, int>();

        if (dbExists)
        {
            try
            {
                var info = new FileInfo(normalizedDb);
                dbSize = info.Length;
                isValidSqlite = HasValidSqliteHeader(normalizedDb, dbSize);
            }
            catch (Exception ex)
            {
                return new ValidateStoragePathsResponseDto
                {
                    Valid = false,
                    AreasRootPath = normalizedAreas,
                    AreasRootExists = areasExists,
                    OrganizerDbPath = normalizedDb,
                    OrganizerDbExists = true,
                    Message = $"Unable to read database file: {ex.Message}"
                };
            }

            if (!isValidSqlite)
            {
                return new ValidateStoragePathsResponseDto
                {
                    Valid = false,
                    AreasRootPath = normalizedAreas,
                    AreasRootExists = areasExists,
                    AreaDirectoryCount = areaCount,
                    SampleAreas = sampleAreas,
                    OrganizerDbPath = normalizedDb,
                    OrganizerDbExists = true,
                    OrganizerDbValidSqlite = false,
                    OrganizerDbSizeBytes = dbSize,
                    Message = "The selected database file is not a valid SQLite (.db) file."
                };
            }

            if (dbSize > 0)
            {
                tables = await ReadCandidateDatabaseStatsAsync(normalizedDb);
            }
        }

        if (!areasExists)
        {
            warnings.Add("Areas folder does not exist yet on disk.");
        }

        if (!dbExists)
        {
            warnings.Add("SQLite database file (organizer.db) does not exist at this path yet.");
        }

        if (!allowMissing && (!areasExists || !dbExists))
        {
            var missingMessage = !areasExists && !dbExists
                ? "Neither the Areas folder nor organizer.db exists at the specified paths. Enable 'Create folder / initialize new database if missing' if you intend to start a new archive."
                : !areasExists
                    ? "The specified Areas folder does not exist. Check the path or enable 'Create folder / initialize new database if missing'."
                    : "The specified organizer.db file was not found. Select an existing organizer.db or enable 'Create folder / initialize new database if missing'.";

            return new ValidateStoragePathsResponseDto
            {
                Valid = false,
                Message = missingMessage,
                Warnings = warnings,
                AreasRootPath = normalizedAreas,
                AreasRootExists = areasExists,
                AreaDirectoryCount = areaCount,
                SampleAreas = sampleAreas,
                OrganizerDbPath = normalizedDb,
                OrganizerDbExists = dbExists,
                OrganizerDbValidSqlite = isValidSqlite,
                OrganizerDbSizeBytes = dbSize,
                Tables = tables
            };
        }

        return new ValidateStoragePathsResponseDto
        {
            Valid = true,
            Message = "Paths verified successfully.",
            Warnings = warnings,
            AreasRootPath = normalizedAreas,
            AreasRootExists = areasExists,
            AreaDirectoryCount = areaCount,
            SampleAreas = sampleAreas,
            OrganizerDbPath = normalizedDb,
            OrganizerDbExists = dbExists,
            OrganizerDbValidSqlite = dbExists ? isValidSqlite : true,
            OrganizerDbSizeBytes = dbSize,
            Tables = tables
        };
    }

    public async Task<(bool Success, string? ErrorMessage, StoragePathsResponseDto? Settings)> UpdatePathsAsync(
        UpdateStoragePathsRequestDto request,
        IFileOrganizerRepository repo)
    {
        var validation = await ValidatePathsAsync(
            request.AreasRootPath,
            request.OrganizerDbPath,
            allowMissing: request.CreateIfMissing);

        if (!validation.Valid)
        {
            return (false, validation.Message ?? "Invalid storage paths.", null);
        }

        var targetAreas = validation.AreasRootPath;
        var targetDb = validation.OrganizerDbPath;

        try
        {
            if (!Directory.Exists(targetAreas))
            {
                Directory.CreateDirectory(targetAreas);
            }

            var dbParent = Path.GetDirectoryName(targetDb);
            if (!string.IsNullOrWhiteSpace(dbParent) && !Directory.Exists(dbParent))
            {
                Directory.CreateDirectory(dbParent);
            }

            // Switch live SQLite connection factory and initialize/verify schema
            _connectionFactory.UpdateDatabasePath(targetDb, createParentDirectory: true);
            await repo.EnsureSchemaAsync();

            lock (_sync)
            {
                _areasRootPath = targetAreas;
                _organizerDbPath = _connectionFactory.DatabasePath;
                _source = "config.paths.json";
            }

            Environment.SetEnvironmentVariable("AREAS_ROOT_PATH", targetAreas);
            Environment.SetEnvironmentVariable("ORGANIZER_DB_PATH", targetDb);

            PersistPathsAtomically(targetAreas, targetDb);

            var current = await GetCurrentSettingsAsync(repo);
            return (true, null, current);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to update storage paths to Areas={Areas}, Db={Db}", targetAreas, targetDb);
            return (false, $"Failed to apply storage paths: {ex.Message}", null);
        }
    }

    private void PersistPathsAtomically(string areasRootPath, string organizerDbPath)
    {
        var dir = Path.GetDirectoryName(_settingsFilePath);
        if (!string.IsNullOrWhiteSpace(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }

        var payload = new PersistedPathsConfig
        {
            AreasRootPath = areasRootPath,
            OrganizerDbPath = organizerDbPath,
            UpdatedAt = DateTime.UtcNow.ToString("O")
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        var tempFile = _settingsFilePath + $".{Guid.NewGuid():N}.tmp";
        File.WriteAllText(tempFile, json, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
        File.Move(tempFile, _settingsFilePath, overwrite: true);
    }

    public BrowsePathsResponseDto BrowseServerFilesystem(string? targetPath, bool includeDbFiles = true)
    {
        var roots = GetAvailableRoots();
        var currentDir = ResolveBrowseDirectory(targetPath);

        string? parentPath = null;
        try
        {
            parentPath = Directory.GetParent(currentDir)?.FullName;
        }
        catch
        {
            parentPath = null;
        }

        var entries = new List<BrowseEntryDto>();
        try
        {
            var dirInfo = new DirectoryInfo(currentDir);
            var options = new EnumerationOptions
            {
                IgnoreInaccessible = true,
                ReturnSpecialDirectories = false
            };

            var subDirs = dirInfo
                .EnumerateDirectories("*", options)
                .Where(d => !d.Name.StartsWith('.'))
                .OrderBy(d => d.Name, StringComparer.OrdinalIgnoreCase)
                .Take(250);

            foreach (var sub in subDirs)
            {
                entries.Add(new BrowseEntryDto
                {
                    Name = sub.Name,
                    Path = sub.FullName,
                    IsDirectory = true
                });
            }

            if (includeDbFiles)
            {
                var dbFiles = dirInfo
                    .EnumerateFiles("*", options)
                    .Where(f =>
                        f.Extension.Equals(".db", StringComparison.OrdinalIgnoreCase) ||
                        f.Extension.Equals(".sqlite", StringComparison.OrdinalIgnoreCase) ||
                        f.Extension.Equals(".sqlite3", StringComparison.OrdinalIgnoreCase))
                    .OrderBy(f => f.Name, StringComparer.OrdinalIgnoreCase)
                    .Take(100);

                foreach (var file in dbFiles)
                {
                    entries.Add(new BrowseEntryDto
                    {
                        Name = file.Name,
                        Path = file.FullName,
                        IsDirectory = false,
                        SizeBytes = file.Length
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "BrowseServerFilesystem warning at {Path}", currentDir);
        }

        return new BrowsePathsResponseDto
        {
            CurrentPath = currentDir,
            ParentPath = parentPath,
            Roots = roots,
            Entries = entries
        };
    }

    private string ResolveBrowseDirectory(string? targetPath)
    {
        var candidate = CleanPathInput(targetPath);
        if (!string.IsNullOrWhiteSpace(candidate))
        {
            try
            {
                var full = Path.GetFullPath(candidate);
                if (File.Exists(full))
                {
                    var fileDir = Path.GetDirectoryName(full);
                    if (!string.IsNullOrWhiteSpace(fileDir) && Directory.Exists(fileDir))
                        return fileDir;
                }

                // Walk upward if a non-existent child folder was typed
                var probe = full;
                for (int i = 0; i < 6 && !string.IsNullOrWhiteSpace(probe); i++)
                {
                    if (Directory.Exists(probe))
                        return probe;
                    probe = Path.GetDirectoryName(probe);
                }
            }
            catch
            {
                // Fall back below
            }
        }

        var activeAreas = AreasRootPath;
        if (!string.IsNullOrWhiteSpace(activeAreas) && Directory.Exists(activeAreas))
            return activeAreas;

        var activeAreasParent = !string.IsNullOrWhiteSpace(activeAreas) ? Path.GetDirectoryName(activeAreas) : null;
        if (!string.IsNullOrWhiteSpace(activeAreasParent) && Directory.Exists(activeAreasParent))
            return activeAreasParent;

        return Directory.GetCurrentDirectory();
    }

    private static List<string> GetAvailableRoots()
    {
        var roots = new List<string>();
        try
        {
            foreach (var drive in DriveInfo.GetDrives())
            {
                try
                {
                    if (drive.IsReady && !roots.Contains(drive.RootDirectory.FullName, StringComparer.OrdinalIgnoreCase))
                    {
                        roots.Add(drive.RootDirectory.FullName);
                    }
                }
                catch
                {
                    // Skip unready/inaccessible drive
                }
            }
        }
        catch
        {
            // Ignore drive enumeration issues
        }

        if (roots.Count == 0)
        {
            roots.Add(Path.GetPathRoot(Directory.GetCurrentDirectory()) ?? "/");
        }

        return roots;
    }

    private static (int Count, List<string> Samples) InspectAreasDirectory(string? areasPath)
    {
        if (string.IsNullOrWhiteSpace(areasPath) || !Directory.Exists(areasPath))
            return (0, new List<string>());

        try
        {
            var options = new EnumerationOptions
            {
                IgnoreInaccessible = true,
                ReturnSpecialDirectories = false
            };

            var dirs = new DirectoryInfo(areasPath)
                .EnumerateDirectories("*", options)
                .Where(d => !d.Name.StartsWith('.') &&
                            !d.Name.Equals("System Volume Information", StringComparison.OrdinalIgnoreCase) &&
                            !d.Name.Equals("$RECYCLE.BIN", StringComparison.OrdinalIgnoreCase))
                .Select(d => d.Name)
                .OrderBy(n => n, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return (dirs.Count, dirs.Take(6).ToList());
        }
        catch
        {
            return (0, new List<string>());
        }
    }

    private static bool HasValidSqliteHeader(string filePath, long fileSize)
    {
        if (fileSize == 0)
            return true;

        if (fileSize < SqliteMagicHeader.Length)
            return false;

        Span<byte> header = stackalloc byte[16];
        using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        var read = fs.Read(header);
        if (read < SqliteMagicHeader.Length)
            return false;

        return header.SequenceEqual(SqliteMagicHeader);
    }

    private static async Task<Dictionary<string, int>> ReadCandidateDatabaseStatsAsync(string dbPath)
    {
        var stats = new Dictionary<string, int>();
        var tables = new[] { "areas", "houses", "tenants", "documents" };

        try
        {
            var connString = $"Data Source={dbPath};Mode=ReadOnly;Pooling=False;";
            await using var conn = new SqliteConnection(connString);
            await conn.OpenAsync();

            foreach (var table in tables)
            {
                try
                {
                    var exists = await conn.ExecuteScalarAsync<int>(
                        "SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name=@Name;",
                        new { Name = table });
                    if (exists > 0)
                    {
                        stats[table] = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM \"{table}\";");
                    }
                }
                catch
                {
                    // Ignore missing/uninitialized table
                }
            }
        }
        catch
        {
            // Return partial/empty stats if read-only inspection fails
        }

        return stats;
    }
}
