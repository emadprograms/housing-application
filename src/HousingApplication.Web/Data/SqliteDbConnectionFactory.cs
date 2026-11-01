using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

namespace FileOrganizer.Web.Data;

public interface ISqliteDbConnectionFactory
{
    string DatabasePath { get; }
    void UpdateDatabasePath(string newDbPath, bool createParentDirectory = true);
    SqliteConnection CreateConnection();
    Task<SqliteConnection> CreateConnectionAsync(CancellationToken cancellationToken = default);
}

public class SqliteDbConnectionFactory : ISqliteDbConnectionFactory
{
    private readonly object _sync = new();
    private string _connectionString = string.Empty;
    private string _databasePath = string.Empty;

    public string DatabasePath
    {
        get
        {
            lock (_sync)
            {
                return _databasePath;
            }
        }
    }

    public SqliteDbConnectionFactory(IConfiguration? configuration = null, string? dbPath = null)
    {
        var rawPath = dbPath
            ?? configuration?["ORGANIZER_DB_PATH"]
            ?? configuration?["ORGANIZER_DB"]
            ?? configuration?["organizer_db"]
            ?? configuration?["organizer_db_path"]
            ?? configuration?["Database:Path"]
            ?? Environment.GetEnvironmentVariable("ORGANIZER_DB_PATH")
            ?? Environment.GetEnvironmentVariable("ORGANIZER_DB")
            ?? (File.Exists(@"D:\areas_v11\organizer.db") ? @"D:\areas_v11\organizer.db" : null)
            ?? (File.Exists(@"D:\organizer.db") ? @"D:\organizer.db" : null)
            ?? "organizer.db";

        var resolvedPath = ResolveInitialPath(rawPath);
        ApplyDatabasePathInternal(resolvedPath, createParentDirectory: true, clearPools: false);
    }

    private static string ResolveInitialPath(string rawPath)
    {
        var trimmed = (rawPath ?? "organizer.db").Trim().Trim('"', '\'');
        if (string.IsNullOrWhiteSpace(trimmed))
            return "organizer.db";

        if (trimmed.Equals(":memory:", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        if (Path.IsPathRooted(trimmed))
            return Path.GetFullPath(trimmed);

        var cwdCandidate = Path.GetFullPath(trimmed);
        if (File.Exists(cwdCandidate))
            return cwdCandidate;

        try
        {
            var baseDirCandidate = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, trimmed));
            if (File.Exists(baseDirCandidate))
                return baseDirCandidate;

            var baseDirParent = Path.GetDirectoryName(baseDirCandidate);
            var cwdParent = Path.GetDirectoryName(cwdCandidate);
            if (!string.IsNullOrEmpty(baseDirParent) && Directory.Exists(baseDirParent) &&
                (string.IsNullOrEmpty(cwdParent) || !Directory.Exists(cwdParent)))
            {
                return baseDirCandidate;
            }
        }
        catch
        {
            // Fall back to CWD resolution if AppContext.BaseDirectory combination fails
        }

        return cwdCandidate;
    }

    public void UpdateDatabasePath(string newDbPath, bool createParentDirectory = true)
    {
        if (string.IsNullOrWhiteSpace(newDbPath))
            throw new ArgumentException("Database path cannot be empty.", nameof(newDbPath));

        var trimmed = newDbPath.Trim().Trim('"', '\'');
        var normalized = (trimmed.Equals(":memory:", StringComparison.OrdinalIgnoreCase) ||
                          trimmed.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
            ? trimmed
            : Path.GetFullPath(trimmed);

        ApplyDatabasePathInternal(normalized, createParentDirectory, clearPools: true);
    }

    private void ApplyDatabasePathInternal(string resolvedPath, bool createParentDirectory, bool clearPools)
    {
        bool pathChanged;
        lock (_sync)
        {
            if (createParentDirectory &&
                !resolvedPath.Equals(":memory:", StringComparison.OrdinalIgnoreCase) &&
                !resolvedPath.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
            {
                var dir = Path.GetDirectoryName(Path.GetFullPath(resolvedPath));
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }
            }

            pathChanged = !string.Equals(_databasePath, resolvedPath, StringComparison.OrdinalIgnoreCase);
            _databasePath = resolvedPath;
            var mode = File.Exists(resolvedPath) ? "ReadWrite" : "ReadWriteCreate";
            _connectionString = $"Data Source={resolvedPath};Mode={mode};Cache=Default;Pooling=True;";
        }

        if (clearPools && pathChanged)
        {
            try
            {
                SqliteConnection.ClearAllPools();
            }
            catch
            {
                // Ignore pool clear exceptions if no pools are active
            }
        }
    }

    private static void ConfigurePragmas(SqliteConnection conn)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA synchronous=NORMAL;";
        cmd.ExecuteNonQuery();

        try
        {
            cmd.CommandText = "PRAGMA journal_mode=WAL;";
            cmd.ExecuteNonQuery();
        }
        catch
        {
            try
            {
                cmd.CommandText = "PRAGMA journal_mode=DELETE;";
                cmd.ExecuteNonQuery();
            }
            catch
            {
                // Ignore if pragma cannot be set
            }
        }
    }

    private static async Task ConfigurePragmasAsync(SqliteConnection conn, CancellationToken cancellationToken)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA synchronous=NORMAL;";
        await cmd.ExecuteNonQueryAsync(cancellationToken);

        try
        {
            cmd.CommandText = "PRAGMA journal_mode=WAL;";
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        catch
        {
            try
            {
                cmd.CommandText = "PRAGMA journal_mode=DELETE;";
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
            catch
            {
                // Ignore if pragma cannot be set
            }
        }
    }

    public SqliteConnection CreateConnection()
    {
        string connStr;
        lock (_sync)
        {
            connStr = _connectionString;
        }

        var conn = new SqliteConnection(connStr);
        conn.Open();
        ConfigurePragmas(conn);
        return conn;
    }

    public async Task<SqliteConnection> CreateConnectionAsync(CancellationToken cancellationToken = default)
    {
        string connStr;
        lock (_sync)
        {
            connStr = _connectionString;
        }

        var conn = new SqliteConnection(connStr);
        await conn.OpenAsync(cancellationToken);
        await ConfigurePragmasAsync(conn, cancellationToken);
        return conn;
    }
}
