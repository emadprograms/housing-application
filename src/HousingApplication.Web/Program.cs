using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using FileOrganizer.Web.Common;
using FileOrganizer.Web.Data;
using FileOrganizer.Web.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.Json;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;

var builder = WebApplication.CreateBuilder(args);


// Robust wwwroot resolution across development, standalone binary execution, and publish layouts
var candidateWebRoots = new[]
{
    builder.Environment.WebRootPath,
    Path.Combine(builder.Environment.ContentRootPath, "wwwroot"),
    Path.Combine(AppContext.BaseDirectory, "wwwroot"),
    Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "wwwroot"),
    Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "src", "HousingApplication.Web", "wwwroot"),
    Path.Combine(Directory.GetCurrentDirectory(), "src", "HousingApplication.Web", "wwwroot"),
    Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
    Path.Combine(Directory.GetCurrentDirectory(), "dist", "win-x64", "wwwroot")
};

string? resolvedWebRoot = candidateWebRoots
    .Where(p => !string.IsNullOrEmpty(p))
    .Select(p => Path.GetFullPath(p))
    .FirstOrDefault(p => Directory.Exists(p) && File.Exists(Path.Combine(p, "index.html")));

if (!string.IsNullOrEmpty(resolvedWebRoot))
{
    builder.Environment.WebRootPath = resolvedWebRoot;
}

// Configure JSON options to match snake_case API contracts
builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure Cookie Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "HousingApp.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromDays(30);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        options.Events.OnValidatePrincipal = async context =>
        {
            var principal = context.Principal;
            if (principal?.Identity?.IsAuthenticated != true)
                return;

            var repo = context.HttpContext.RequestServices.GetService<IFileOrganizerRepository>();
            if (repo == null)
                return;

            User? dbUser = null;
            if (int.TryParse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid) && uid > 0)
            {
                dbUser = await repo.GetUserByIdAsync(uid);
            }
            else if (!string.IsNullOrWhiteSpace(principal.Identity.Name))
            {
                dbUser = await repo.GetUserByUsernameAsync(principal.Identity.Name);
            }

            if (dbUser == null || dbUser.IsActive == 0)
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return;
            }

            var currentRole = principal.FindFirst(ClaimTypes.Role)?.Value ?? principal.FindFirst("role")?.Value ?? string.Empty;
            var currentDisplay = principal.FindFirst("display_name")?.Value ?? string.Empty;

            if (!string.Equals(currentRole, dbUser.Role, StringComparison.Ordinal) ||
                !string.Equals(currentDisplay, dbUser.DisplayName, StringComparison.Ordinal))
            {
                var canDelete = string.Equals(dbUser.Role, "SuperUser", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(dbUser.Role, "Admin", StringComparison.OrdinalIgnoreCase);
                var isSuper = string.Equals(dbUser.Role, "SuperUser", StringComparison.OrdinalIgnoreCase);

                var refreshedClaims = new List<Claim>
                {
                    new(ClaimTypes.NameIdentifier, dbUser.Id.ToString()),
                    new(ClaimTypes.Name, dbUser.Username),
                    new("display_name", dbUser.DisplayName),
                    new(ClaimTypes.Role, dbUser.Role),
                    new("role", dbUser.Role),
                    new("can_delete", canDelete.ToString().ToLowerInvariant()),
                    new("can_manage_users", isSuper.ToString().ToLowerInvariant())
                };

                context.ReplacePrincipal(new ClaimsPrincipal(
                    new ClaimsIdentity(refreshedClaims, CookieAuthenticationDefaults.AuthenticationScheme)));
                context.ShouldRenew = true;
            }
        };
    });
builder.Services.AddAuthorization();

// Register DI services
builder.Services.AddSingleton<ISqliteDbConnectionFactory, SqliteDbConnectionFactory>();
builder.Services.AddSingleton<IStoragePathSettingsService, StoragePathSettingsService>();
builder.Services.AddScoped<IFileOrganizerRepository, FileOrganizerRepository>();

// Configure response compression for fast asset and API delivery over internet
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

var app = builder.Build();
var storagePathService = app.Services.GetRequiredService<IStoragePathSettingsService>();

// Ensure DB schema is initialized
using (var scope = app.Services.CreateScope())
{
    var repo = scope.ServiceProvider.GetRequiredService<IFileOrganizerRepository>();
    try
    {
        await repo.EnsureSchemaAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Schema initialization warning");
    }
}

app.UseCors();
app.UseResponseCompression();
app.UseAuthentication();
app.UseAuthorization();

// Static file serving from wwwroot/
var staticContentTypeProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
staticContentTypeProvider.Mappings[".properties"] = "text/plain";
staticContentTypeProvider.Mappings[".bcmap"] = "application/octet-stream";
staticContentTypeProvider.Mappings[".pfb"] = "application/octet-stream";
staticContentTypeProvider.Mappings[".mjs"] = "text/javascript";
staticContentTypeProvider.Mappings[".wasm"] = "application/wasm";
staticContentTypeProvider.Mappings[".gz"] = "application/gzip";
staticContentTypeProvider.Mappings[".traineddata"] = "application/octet-stream";

Microsoft.Extensions.FileProviders.IFileProvider? webRootFileProvider = null;
if (!string.IsNullOrEmpty(resolvedWebRoot) && Directory.Exists(resolvedWebRoot))
{
    webRootFileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(resolvedWebRoot);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = webRootFileProvider });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = webRootFileProvider,
        ContentTypeProvider = staticContentTypeProvider,
        OnPrepareResponse = ctx =>
        {
            var path = ctx.Context.Request.Path.Value ?? "";
            if (path.StartsWith("/lib/", StringComparison.OrdinalIgnoreCase))
            {
                ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=31536000, immutable");
            }
            else
            {
                ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
                ctx.Context.Response.Headers.Append("Pragma", "no-cache");
                ctx.Context.Response.Headers.Append("Expires", "0");
            }
        }
    });
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        ContentTypeProvider = staticContentTypeProvider,
        OnPrepareResponse = ctx =>
        {
            var path = ctx.Context.Request.Path.Value ?? "";
            if (path.StartsWith("/lib/", StringComparison.OrdinalIgnoreCase))
            {
                ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=31536000, immutable");
            }
            else
            {
                ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
                ctx.Context.Response.Headers.Append("Pragma", "no-cache");
                ctx.Context.Response.Headers.Append("Expires", "0");
            }
        }
    });
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    build_version = "2026.11.01.2",
    applicant_support = true,
    storage_settings_support = true,
    user_management_support = true,
    executable_path = Environment.ProcessPath
}));

// ---------------------------------------------------------------------------
// RBAC Security Helpers
// ---------------------------------------------------------------------------
static bool IsPrivilegedRole(string? role) =>
    string.Equals(role, "SuperUser", StringComparison.OrdinalIgnoreCase) ||
    string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);

static bool IsRestrictedFromDelete(HttpContext ctx)
{
    // If authenticated user is a Contributor (Regular User), they cannot delete
    if (ctx.User.Identity?.IsAuthenticated == true)
    {
        if (ctx.User.IsInRole("Contributor")) return true;
        var canDeleteClaim = ctx.User.FindFirst("can_delete")?.Value;
        if (string.Equals(canDeleteClaim, "false", StringComparison.OrdinalIgnoreCase)) return true;
        var role = ctx.User.FindFirst(ClaimTypes.Role)?.Value ?? ctx.User.FindFirst("role")?.Value;
        if (string.Equals(role, "Contributor", StringComparison.OrdinalIgnoreCase)) return true;
        if (IsPrivilegedRole(role)) return false;
    }

    // Optional header-based role checking (for testing and automation)
    var headerRole = ctx.Request.Headers["X-User-Role"].FirstOrDefault();
    if (string.Equals(headerRole, "Contributor", StringComparison.OrdinalIgnoreCase))
        return true;
    if (IsPrivilegedRole(headerRole))
        return false;

    var headerUser = ctx.Request.Headers["X-User"].FirstOrDefault();
    if (!string.IsNullOrEmpty(headerUser))
    {
        var repo = ctx.RequestServices.GetService<IFileOrganizerRepository>();
        if (repo != null)
        {
            try
            {
                var dbUser = repo.GetUserByUsernameAsync(headerUser.Trim()).GetAwaiter().GetResult();
                if (dbUser != null)
                {
                    return !IsPrivilegedRole(dbUser.Role);
                }
            }
            catch
            {
                // Fall back to default sets if DB lookup fails
            }
        }

        var contributors = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Nawaf", "Naseem", "Mulla", "Mariam", "Shaima", "Mona"
        };
        if (contributors.Contains(headerUser.Trim()))
            return true;

        var admins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Emad", "Bubshait", "Ehtezaz", "Mustafa"
        };
        if (admins.Contains(headerUser.Trim()))
            return false;
    }

    return false;
}

static async Task<(bool IsSuperUser, int? ActingUserId)> CheckSuperUserAccessAsync(
    HttpContext ctx,
    IFileOrganizerRepository repo)
{
    if (ctx.User.Identity?.IsAuthenticated == true)
    {
        User? dbUser = null;
        if (int.TryParse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid) && uid > 0)
        {
            dbUser = await repo.GetUserByIdAsync(uid);
        }
        else if (!string.IsNullOrWhiteSpace(ctx.User.Identity.Name))
        {
            dbUser = await repo.GetUserByUsernameAsync(ctx.User.Identity.Name);
        }

        if (dbUser != null)
        {
            return (string.Equals(dbUser.Role, "SuperUser", StringComparison.OrdinalIgnoreCase), dbUser.Id);
        }

        var claimRole = ctx.User.FindFirst(ClaimTypes.Role)?.Value ?? ctx.User.FindFirst("role")?.Value;
        int.TryParse(ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var fallbackId);
        return (string.Equals(claimRole, "SuperUser", StringComparison.OrdinalIgnoreCase), fallbackId > 0 ? fallbackId : null);
    }

    var headerUser = ctx.Request.Headers["X-User"].FirstOrDefault();
    var headerRole = ctx.Request.Headers["X-User-Role"].FirstOrDefault();

    if (!string.IsNullOrWhiteSpace(headerUser))
    {
        var dbUser = await repo.GetUserByUsernameAsync(headerUser.Trim());
        if (dbUser != null)
        {
            return (string.Equals(dbUser.Role, "SuperUser", StringComparison.OrdinalIgnoreCase), dbUser.Id);
        }
    }

    if (string.Equals(headerRole, "SuperUser", StringComparison.OrdinalIgnoreCase))
    {
        return (true, null);
    }

    return (false, null);
}

string ResolveAreasRoot(IConfiguration config) => storagePathService.ResolveAreasRoot(config);

// ---------------------------------------------------------------------------
// Authentication API
// ---------------------------------------------------------------------------
app.MapGet("/api/auth/users", async (IFileOrganizerRepository repo) =>
{
    var users = await repo.GetAllUsersAsync();
    return Results.Ok(users);
});

app.MapGet("/api/auth/me", (HttpContext httpContext) =>
{
    if (httpContext.User.Identity?.IsAuthenticated != true)
    {
        return Results.Ok(new AuthStatusResponseDto
        {
            Authenticated = false,
            User = null
        });
    }

    var username = httpContext.User.Identity.Name ?? "";
    var displayName = httpContext.User.FindFirst("display_name")?.Value ?? username;
    var role = httpContext.User.FindFirst(ClaimTypes.Role)?.Value ?? httpContext.User.FindFirst("role")?.Value ?? "Contributor";
    int.TryParse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id);

    var userDto = new UserDto
    {
        Id = id,
        Username = username,
        DisplayName = displayName,
        Role = role
    };

    return Results.Ok(new AuthStatusResponseDto
    {
        Authenticated = true,
        User = userDto
    });
});

app.MapPost("/api/auth/login", async (
    LoginRequestDto req,
    HttpContext httpContext,
    IFileOrganizerRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(req.Username))
        return Results.BadRequest(new { error = "Username is required." });

    var user = await repo.GetUserByUsernameAsync(req.Username.Trim());
    if (user == null)
        return Results.Json(new { error = "Invalid username or password." }, statusCode: StatusCodes.Status401Unauthorized);

    var isPasswordValid = PasswordHasher.VerifyPassword(
        req.Password,
        user.PasswordHash,
        user.Salt,
        user.Username,
        allowLegacyShortcuts: user.HasCustomPassword == 0);
    if (!isPasswordValid)
        return Results.Json(new { error = "Invalid username or password." }, statusCode: StatusCodes.Status401Unauthorized);

    var canDelete = IsPrivilegedRole(user.Role);
    var isSuperUser = string.Equals(user.Role, "SuperUser", StringComparison.OrdinalIgnoreCase);
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Name, user.Username),
        new("display_name", user.DisplayName),
        new(ClaimTypes.Role, user.Role),
        new("role", user.Role),
        new("can_delete", canDelete.ToString().ToLowerInvariant()),
        new("can_manage_users", isSuperUser.ToString().ToLowerInvariant())
    };

    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));

    var userDto = new UserDto
    {
        Id = user.Id,
        Username = user.Username,
        DisplayName = user.DisplayName,
        Role = user.Role
    };

    return Results.Ok(new LoginResponseDto
    {
        Success = true,
        Message = "Logged in successfully.",
        User = userDto
    });
});

app.MapPost("/api/auth/logout", async (HttpContext httpContext) =>
{
    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok(new { success = true, message = "Logged out successfully." });
});

// ---------------------------------------------------------------------------
// Tree API
// ---------------------------------------------------------------------------
app.MapGet("/api/tree", async (
    bool? include_categories,
    bool? includeCategories,
    bool? include_timeline,
    bool? includeTimeline,
    IFileOrganizerRepository repo) =>
{
    var incCat = (include_categories ?? false) || (includeCategories ?? false);
    var incTime = (include_timeline ?? false) || (includeTimeline ?? false);
    var tree = await repo.GetTreeAsync(incCat, incTime);
    return Results.Ok(tree);
});

// ---------------------------------------------------------------------------
// Areas & Houses API
// ---------------------------------------------------------------------------
app.MapPost("/api/areas", async (
    CreateAreaRequestDto? request,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (request == null)
    {
        return Results.BadRequest(new { error = "Request body is required.", detail = "Request body is required." });
    }

    var targetAreaId = !string.IsNullOrWhiteSpace(request.AreaId)
        ? request.AreaId.Trim()
        : (request.Name?.Trim() ?? string.Empty);

    if (string.IsNullOrWhiteSpace(targetAreaId))
    {
        return Results.BadRequest(new { error = "Area name is required and cannot be empty.", detail = "Area name is required and cannot be empty." });
    }

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.CreateAreaAsync(
            targetAreaId,
            request.Code,
            areasRoot);
        return Results.Ok(result);
    }
    catch (InvalidOperationException ex)
    {
        return Results.Conflict(new { error = ex.Message, detail = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message, detail = ex.Message });
    }
});

app.MapDelete("/api/areas/{areaId}", async (
    string areaId,
    HttpContext httpContext,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (IsRestrictedFromDelete(httpContext))
    {
        return Results.Json(
            new { status = "error", error = "Permission denied: Contributor accounts have read and upload access only and cannot delete records." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    if (string.IsNullOrWhiteSpace(areaId))
    {
        return Results.BadRequest(new { error = "Area ID is required and cannot be empty.", detail = "Area ID is required and cannot be empty." });
    }

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var success = await repo.DeleteAreaAsync(areaId, areasRoot);
        if (!success)
        {
            return Results.NotFound(new { error = $"Area '{areaId}' not found.", detail = $"Area '{areaId}' not found." });
        }

        return Results.Ok(new { status = "success", area_id = areaId.Trim(), message = $"Area '{areaId.Trim()}' deleted successfully." });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message, detail = ex.Message });
    }
});

app.MapGet("/api/houses", async (string? area_id, string? areaId, IFileOrganizerRepository repo) =>
{
    var targetArea = area_id ?? areaId;
    var houses = await repo.GetHousesAsync(targetArea);
    return Results.Ok(houses);
});

app.MapPost("/api/areas/{areaId}/houses", async (
    string areaId,
    CreateHouseRequestDto request,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (string.IsNullOrWhiteSpace(request.HouseId))
    {
        return Results.BadRequest(new { error = "House ID is required and cannot be empty." });
    }

    var cleanAreaId = !string.IsNullOrWhiteSpace(areaId) ? areaId.Trim() : (request.AreaId?.Trim() ?? "");
    if (string.IsNullOrWhiteSpace(cleanAreaId))
    {
        return Results.BadRequest(new { error = "Area ID is required and cannot be empty." });
    }

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.CreateHouseAsync(
            cleanAreaId,
            request.HouseId,
            request.InitialTenantName,
            startDate: null,
            areasRoot
        );
        return Results.Ok(result);
    }
    catch (InvalidOperationException ex)
    {
        return Results.Conflict(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapDelete("/api/areas/{areaId}/houses/{houseId}", async (
    string areaId,
    string houseId,
    HttpContext httpContext,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (IsRestrictedFromDelete(httpContext))
        return Results.Json(new { status = "error", error = "Permission denied: Contributor accounts have read and upload access only and cannot delete records." }, statusCode: StatusCodes.Status403Forbidden);

    if (string.IsNullOrWhiteSpace(houseId))
    {
        return Results.BadRequest(new { error = "House ID is required and cannot be empty." });
    }

    var areasRoot = ResolveAreasRoot(config);
    var success = await repo.DeleteHouseAsync(areaId, houseId, areasRoot);
    if (!success)
    {
        return Results.NotFound(new { error = $"House '{houseId}' not found in area '{areaId}'." });
    }

    return Results.Ok(new { status = "success", message = $"House '{houseId}' deleted successfully." });
});

// House profile / card
app.MapGet("/api/areas/{areaId}/houses/{houseId}", async (string areaId, string houseId, IFileOrganizerRepository repo) =>
{
    var profile = await repo.GetHouseProfileAsync(areaId, houseId);
    if (profile == null)
        return Results.NotFound(new { error = "House not found." });
    return Results.Ok(profile);
});

app.MapGet("/api/areas/{areaId}/houses/{houseId}/profile", async (string areaId, string houseId, IFileOrganizerRepository repo) =>
{
    var profile = await repo.GetHouseProfileAsync(areaId, houseId);
    if (profile == null)
        return Results.NotFound(new { error = "House not found." });
    return Results.Ok(profile);
});

// House vault listing
app.MapGet("/api/areas/{areaId}/houses/{houseId}/vault", async (string areaId, string houseId, IFileOrganizerRepository repo) =>
{
    var profile = await repo.GetHouseProfileAsync(areaId, houseId);
    if (profile == null)
        return Results.NotFound(new { error = "House not found." });

    var categories = await repo.GetCategoriesAsync(areaId, houseId);
    var allDocs = categories.SelectMany(c => c.Documents).ToList();
    return Results.Ok(allDocs);
});

app.MapGet("/api/houses/{houseId}/vault", async (string houseId, IFileOrganizerRepository repo) =>
{
    var categories = await repo.GetCategoriesAsync("", houseId);
    var allDocs = categories.SelectMany(c => c.Documents).ToList();
    return Results.Ok(allDocs);
});

// ---------------------------------------------------------------------------
// Export ZIP API
// ---------------------------------------------------------------------------
app.MapGet("/api/areas/{areaId}/houses/{houseId}/export-zip", async (
    string areaId,
    string houseId,
    int? tenantId,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var profile = await repo.GetHouseProfileAsync(areaId, houseId);
    if (profile == null)
        return Results.NotFound(new { error = "House not found." });

    var categories = await repo.GetCategoriesAsync(areaId, houseId);
    var allDocs = categories.SelectMany(c => c.Documents).ToList();

    string? tenantName = null;
    if (tenantId.HasValue)
    {
        allDocs = allDocs.Where(d => d.TenantId == tenantId.Value).ToList();
        var tenants = await repo.GetTenantsAsync(houseId);
        tenantName = tenants.FirstOrDefault(t => t.Id == tenantId.Value)?.Name;
    }

    var areasRoot = ResolveAreasRoot(config);
    if (!Directory.Exists(areasRoot))
    {
        var envRoot = Environment.GetEnvironmentVariable("AREAS_ROOT_PATH") ?? Environment.GetEnvironmentVariable("AREAS_ROOT");
        if (!string.IsNullOrEmpty(envRoot) && Directory.Exists(envRoot))
            areasRoot = envRoot;
        else
            areasRoot = Directory.GetCurrentDirectory();
    }

    var houseDir = Path.Combine(areasRoot, areaId, houseId);
    var vaultDir = Path.Combine(houseDir, "vault");
    var sourceVaultDir = Path.Combine(houseDir, ".source_files", "vault");

    var memoryStream = new MemoryStream();
    using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
    {
        var seenNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var doc in allDocs)
        {
            var candidates = new[]
            {
                Path.Combine(vaultDir, $"doc_{doc.VaultId}.pdf"),
                Path.Combine(vaultDir, $"{doc.VaultId}.pdf"),
                Path.Combine(sourceVaultDir, $"doc_{doc.VaultId}.pdf"),
                Path.Combine(sourceVaultDir, $"{doc.VaultId}.pdf")
            };

            var filePath = candidates.FirstOrDefault(File.Exists);
            if (filePath == null) continue;

            var formattedCat = Constants.FormatCategoryWithPrefix(doc.Category);
            var safeCat = Regex.Replace(formattedCat, @"[\\/*?:""<>|]", "_").Trim();
            var safeTitle = Regex.Replace(doc.BriefArabicTitle ?? doc.Filename ?? doc.VaultId, @"[\\/*?:""<>|]", "_").Trim();
            var datePrefix = !string.IsNullOrEmpty(doc.Date) ? $"{doc.Date}_" : "";
            var baseName = $"{datePrefix}{safeTitle}.pdf";

            var archivePath = $"{safeCat}/{baseName}";
            int counter = 1;
            while (seenNames.Contains(archivePath))
            {
                archivePath = $"{safeCat}/{datePrefix}{safeTitle}_{counter}.pdf";
                counter++;
            }
            seenNames.Add(archivePath);

            var entry = archive.CreateEntry(archivePath, CompressionLevel.Optimal);
            using var entryStream = entry.Open();
            using var fileStream = File.OpenRead(filePath);
            await fileStream.CopyToAsync(entryStream);
        }

        if (seenNames.Count == 0)
        {
            var readme = archive.CreateEntry("README.txt");
            using var writer = new StreamWriter(readme.Open());
            await writer.WriteLineAsync($"No documents found in vault for Area {areaId}, House {houseId}.");
        }
    }

    memoryStream.Seek(0, SeekOrigin.Begin);
    var safeArea = Regex.Replace(areaId, @"[^\w\-]", "_");
    var safeHouse = Regex.Replace(houseId, @"[^\w\-]", "_");
    string filename;
    if (tenantId.HasValue)
    {
        if (!string.IsNullOrWhiteSpace(tenantName))
        {
            var safeTenant = Regex.Replace(tenantName, @"[^\w\-]", "_");
            filename = $"archive_{safeArea}_{safeHouse}_{safeTenant}.zip";
        }
        else
        {
            filename = $"archive_{safeArea}_{safeHouse}_tenant_{tenantId.Value}.zip";
        }
    }
    else
    {
        filename = $"archive_{safeArea}_{safeHouse}.zip";
    }

    return Results.File(memoryStream.ToArray(), "application/zip", filename);
});

// ---------------------------------------------------------------------------
// Export Combined Chronological PDF Dossier API
// ---------------------------------------------------------------------------
app.MapGet("/api/areas/{areaId}/houses/{houseId}/export-pdf", async (
    string areaId,
    string houseId,
    int? tenantId,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var profile = await repo.GetHouseProfileAsync(areaId, houseId);
    if (profile == null)
        return Results.NotFound(new { error = "House not found." });

    var categories = await repo.GetCategoriesAsync(areaId, houseId);
    var allDocs = categories.SelectMany(c => c.Documents).ToList();

    string? tenantName = null;
    if (tenantId.HasValue)
    {
        allDocs = allDocs.Where(d => d.TenantId == tenantId.Value).ToList();
        var tenants = await repo.GetTenantsAsync(houseId);
        tenantName = tenants.FirstOrDefault(t => t.Id == tenantId.Value)?.Name;
    }

    // Descending chronological sort: newest/most recent dates first, empty/null dates last, tie-break by VaultId
    var sortedDocs = allDocs
        .OrderByDescending(d => !string.IsNullOrWhiteSpace(d.Date))
        .ThenByDescending(d => d.Date)
        .ThenBy(d => d.VaultId)
        .ToList();

    var areasRoot = ResolveAreasRoot(config);
    if (!Directory.Exists(areasRoot))
    {
        var envRoot = Environment.GetEnvironmentVariable("AREAS_ROOT_PATH") ?? Environment.GetEnvironmentVariable("AREAS_ROOT");
        if (!string.IsNullOrEmpty(envRoot) && Directory.Exists(envRoot))
            areasRoot = envRoot;
        else
            areasRoot = Directory.GetCurrentDirectory();
    }

    var houseDir = Path.Combine(areasRoot, areaId, houseId);
    var vaultDir = Path.Combine(houseDir, "vault");
    var sourceVaultDir = Path.Combine(houseDir, ".source_files", "vault");

    using var outputDoc = new PdfSharpCore.Pdf.PdfDocument();
    var footerFont = new XFont("Arial", 7.5, XFontStyle.Regular);
    var footerBrush = new XSolidBrush(XColor.FromArgb(100, 116, 139));
    int overallPageIdx = 0;

    foreach (var doc in sortedDocs)
    {
        var candidates = new[]
        {
            Path.Combine(vaultDir, $"doc_{doc.VaultId}.pdf"),
            Path.Combine(vaultDir, $"{doc.VaultId}.pdf"),
            Path.Combine(sourceVaultDir, $"doc_{doc.VaultId}.pdf"),
            Path.Combine(sourceVaultDir, $"{doc.VaultId}.pdf")
        };

        var filePath = candidates.FirstOrDefault(File.Exists);
        if (filePath != null)
        {
            try
            {
                using var inputDoc = PdfSharpCore.Pdf.IO.PdfReader.Open(filePath, PdfSharpCore.Pdf.IO.PdfDocumentOpenMode.Import);
                var docPageCount = inputDoc.PageCount;
                var catName = (doc.Category ?? "").Trim();
                var dateStr = doc.Date ?? "";

                for (int i = 0; i < docPageCount; i++)
                {
                    overallPageIdx++;
                    int pageNum = i + 1;
                    var newPage = outputDoc.AddPage(inputDoc.Pages[i]);

                    using var gfx = XGraphics.FromPdfPage(newPage);

                    if (!string.IsNullOrWhiteSpace(dateStr))
                    {
                        gfx.DrawString(dateStr, footerFont, footerBrush, new XPoint(36, newPage.Height - 16));
                    }

                    if (!string.IsNullOrWhiteSpace(catName))
                    {
                        var shapedCat = ArabicReshaper.ReshapeAndReorder(catName);
                        gfx.DrawString(shapedCat, footerFont, footerBrush, new XPoint(newPage.Width / 2, newPage.Height - 16), XStringFormats.Center);
                    }

                    var paginationStr = $"{pageNum}/{docPageCount}  ({overallPageIdx})";
                    gfx.DrawString(paginationStr, footerFont, footerBrush, new XPoint(newPage.Width - 36, newPage.Height - 16), XStringFormats.TopRight);
                }
            }
            catch
            {
                // Ignore unreadable or corrupted PDF
            }
        }
    }

    if (outputDoc.PageCount == 0)
    {
        outputDoc.AddPage();
    }

    using var ms = new MemoryStream();
    outputDoc.Save(ms, false);

    var safeArea = Regex.Replace(areaId, @"[^\w\-]", "_");
    var safeHouse = Regex.Replace(houseId, @"[^\w\-]", "_");
    string filename;
    if (tenantId.HasValue)
    {
        if (!string.IsNullOrWhiteSpace(tenantName))
        {
            var safeTenant = Regex.Replace(tenantName, @"[^\w\-]", "_");
            filename = $"archive_{safeArea}_{safeHouse}_{safeTenant}.pdf";
        }
        else
        {
            filename = $"archive_{safeArea}_{safeHouse}_tenant_{tenantId.Value}.pdf";
        }
    }
    else
    {
        filename = $"archive_{safeArea}_{safeHouse}.pdf";
    }

    return Results.File(ms.ToArray(), "application/pdf", filename);
});

// ---------------------------------------------------------------------------
// Timeline API
// ---------------------------------------------------------------------------
app.MapGet("/api/areas/{areaId}/houses/{houseId}/timeline", async (
    string areaId,
    string houseId,
    string? tenant_name,
    string? tenantName,
    IFileOrganizerRepository repo) =>
{
    var tName = tenant_name ?? tenantName;
    var timeline = await repo.GetTimelineAsync(areaId, houseId, tName);
    return Results.Ok(timeline);
});

// ---------------------------------------------------------------------------
// Categories API
// ---------------------------------------------------------------------------
app.MapGet("/api/areas/{areaId}/houses/{houseId}/categories", async (string areaId, string houseId, IFileOrganizerRepository repo) =>
{
    var categories = await repo.GetCategoriesAsync(areaId, houseId);
    return Results.Ok(categories);
});

app.MapDelete("/api/areas/{areaId}/houses/{houseId}/categories/{categoryName}", async (
    string areaId,
    string houseId,
    string categoryName,
    HttpContext httpContext,
    IFileOrganizerRepository repo) =>
{
    if (IsRestrictedFromDelete(httpContext))
        return Results.Json(new { status = "error", error = "Permission denied: Contributor accounts have read and upload access only and cannot delete records." }, statusCode: StatusCodes.Status403Forbidden);

    var reassigned = await repo.DeleteCategoryAsync(houseId, categoryName);
    return Results.Ok(new
    {
        status = "success",
        deleted_category = categoryName.Trim(),
        reassigned_docs = reassigned
    });
});

// ---------------------------------------------------------------------------
// Tenants API
// ---------------------------------------------------------------------------
app.MapGet("/api/areas/{areaId}/houses/{houseId}/tenants", async (string areaId, string houseId, IFileOrganizerRepository repo) =>
{
    var tenants = await repo.GetTenantsAsync(houseId);
    return Results.Ok(tenants);
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/tenants", async (
    string areaId,
    string houseId,
    TenantBulkUpdateRequestDto payload,
    IFileOrganizerRepository repo) =>
{
    try
    {
        var result = await repo.BulkUpdateTenantsAsync(houseId, payload.Tenants, payload.Reallocate);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/reallocate", async (
    string areaId,
    string houseId,
    IFileOrganizerRepository repo) =>
{
    try
    {
        var result = await repo.BulkUpdateTenantsAsync(houseId, Array.Empty<TenantDto>(), reallocate: true);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

// ---------------------------------------------------------------------------
// Search API
// ---------------------------------------------------------------------------
app.MapGet("/api/search", async (string? q, int? limit, IFileOrganizerRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(q))
        return Results.Ok(Array.Empty<SearchResultDto>());

    var results = await repo.SearchAsync(q.Trim(), limit ?? 50);
    return Results.Ok(results);
});

// ---------------------------------------------------------------------------
// PDF Streaming API
// ---------------------------------------------------------------------------
app.MapGet("/api/pdf/{vaultId}", async (HttpContext httpContext, string vaultId, IFileOrganizerRepository repo, IConfiguration config) =>
{
    var areasRoot = ResolveAreasRoot(config);
    var doc = await repo.GetDocumentDetailsAsync(vaultId, areasRoot);

    string? filePath = doc?.PhysicalPath;
    if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath))
    {
        var candidates = new[]
        {
            doc != null ? Path.Combine(areasRoot, doc.AreaId ?? "", doc.HouseId ?? "", "vault", $"doc_{vaultId}.pdf") : "",
            doc != null ? Path.Combine(areasRoot, doc.AreaId ?? "", doc.HouseId ?? "", "vault", $"{vaultId}.pdf") : "",
            doc != null ? Path.Combine(areasRoot, doc.AreaId ?? "", doc.HouseId ?? "", ".source_files", "vault", $"doc_{vaultId}.pdf") : "",
            doc != null ? Path.Combine(areasRoot, doc.AreaId ?? "", doc.HouseId ?? "", ".source_files", "vault", $"{vaultId}.pdf") : "",
            (doc?.BatchFilePath != null && doc.AreaId != null && doc.HouseId != null)
                ? Path.Combine(areasRoot, doc.AreaId, doc.HouseId, doc.BatchFilePath)
                : ""
        };

        filePath = candidates.FirstOrDefault(File.Exists);
    }

    if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath))
        return Results.NotFound(new { error = "Resource not found.", solution = "Verify the endpoint URL and the resource ID." });

    var fileInfo = new FileInfo(filePath);
    var lastModified = fileInfo.LastWriteTimeUtc;
    var etag = new Microsoft.Net.Http.Headers.EntityTagHeaderValue($"\"{fileInfo.Length}_{lastModified.Ticks}\"");
    httpContext.Response.Headers.Append("Cache-Control", "private, no-cache, must-revalidate");

    return Results.File(filePath, "application/pdf", lastModified: lastModified, entityTag: etag, enableRangeProcessing: true);
});

app.MapGet("/api/areas/{areaId}/houses/{houseId}/pdf/{vaultId}", async (
    HttpContext httpContext,
    string areaId,
    string houseId,
    string vaultId,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var areasRoot = ResolveAreasRoot(config);
    var cleanHouseId = TextUtils.ExtractHouseNumber(houseId);

    string? filePath = null;

    if (vaultId.StartsWith("fs_"))
    {
        try
        {
            var b64 = vaultId[3..];
            b64 += new string('=', (4 - b64.Length % 4) % 4);
            var relPath = Encoding.UTF8.GetString(Convert.FromBase64String(b64.Replace('-', '+').Replace('_', '/')));
            var cand = Path.Combine(areasRoot, areaId, houseId, relPath);
            if (File.Exists(cand)) filePath = cand;
        }
        catch { }
    }

    if (filePath == null)
    {
        var candidates = new[]
        {
            Path.Combine(areasRoot, areaId, houseId, "vault", $"doc_{vaultId}.pdf"),
            Path.Combine(areasRoot, areaId, houseId, "vault", $"{vaultId}.pdf"),
            Path.Combine(areasRoot, areaId, cleanHouseId, "vault", $"doc_{vaultId}.pdf"),
            Path.Combine(areasRoot, areaId, cleanHouseId, "vault", $"{vaultId}.pdf"),
            Path.Combine(areasRoot, areaId, houseId, ".source_files", "vault", $"doc_{vaultId}.pdf"),
            Path.Combine(areasRoot, areaId, houseId, ".source_files", "vault", $"{vaultId}.pdf"),
            Path.Combine(areasRoot, areaId, cleanHouseId, ".source_files", "vault", $"doc_{vaultId}.pdf"),
            Path.Combine(areasRoot, areaId, cleanHouseId, ".source_files", "vault", $"{vaultId}.pdf")
        };

        filePath = candidates.FirstOrDefault(File.Exists);
    }

    if (filePath == null)
    {
        var doc = await repo.GetDocumentDetailsAsync(vaultId, areasRoot);
        if (doc?.PhysicalPath != null && File.Exists(doc.PhysicalPath))
        {
            filePath = doc.PhysicalPath;
        }
    }

    if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath))
        return Results.NotFound(new { error = "Resource not found.", solution = "Verify the endpoint URL and the resource ID." });

    var fileInfo = new FileInfo(filePath);
    var lastModified = fileInfo.LastWriteTimeUtc;
    var etag = new Microsoft.Net.Http.Headers.EntityTagHeaderValue($"\"{fileInfo.Length}_{lastModified.Ticks}\"");
    httpContext.Response.Headers.Append("Cache-Control", "private, no-cache, must-revalidate");

    return Results.File(filePath, "application/pdf", lastModified: lastModified, entityTag: etag, enableRangeProcessing: true);
});

// ---------------------------------------------------------------------------
// Document Management API
// ---------------------------------------------------------------------------
app.MapGet("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}", async (
    string areaId,
    string houseId,
    string vaultId,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var areasRoot = ResolveAreasRoot(config);
    var doc = await repo.GetDocumentDetailsAsync(vaultId, areasRoot);
    if (doc == null)
        return Results.NotFound(new { error = "Document not found." });
    return Results.Ok(doc);
});

app.MapGet("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/metadata", async (
    string areaId,
    string houseId,
    string vaultId,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var areasRoot = ResolveAreasRoot(config);
    var doc = await repo.GetDocumentDetailsAsync(vaultId, areasRoot);
    if (doc == null)
        return Results.NotFound(new { error = "Document not found." });
    return Results.Ok(doc);
});

app.MapGet("/api/documents/{vaultId}/metadata", async (
    string vaultId,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var areasRoot = ResolveAreasRoot(config);
    var doc = await repo.GetDocumentDetailsAsync(vaultId, areasRoot);
    if (doc == null)
        return Results.NotFound(new { error = "Document not found." });
    return Results.Ok(doc);
});

app.MapPatch("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}", async (
    string areaId,
    string houseId,
    string vaultId,
    DocumentUpdateRequestDto payload,
    IFileOrganizerRepository repo) =>
{
    var result = await repo.UpdateDocumentAsync(
        vaultId,
        arabicTitle: payload.ArabicTitle,
        category: payload.Category,
        tenantId: payload.TenantId,
        primaryDate: payload.PrimaryDate,
        isManual: payload.IsManual ?? 1,
        notes: payload.Notes);

    if (result == null)
        return Results.NotFound(new { error = "Document not found." });
    return Results.Ok(result);
});

app.MapPatch("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/notes", async (
    string areaId,
    string houseId,
    string vaultId,
    DocumentNotesRequestDto payload,
    IFileOrganizerRepository repo) =>
{
    var result = await repo.UpdateDocumentNotesAsync(vaultId, payload.Notes);
    if (result == null)
        return Results.NotFound(new { error = "Document not found." });
    return Results.Ok(result);
});

app.MapPatch("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/tenant", async (
    string areaId,
    string houseId,
    string vaultId,
    DocumentTenantUpdateRequestDto payload,
    IFileOrganizerRepository repo) =>
{
    var result = await repo.UpdateDocumentTenantAsync(vaultId, payload.TenantId);
    if (result == null)
        return Results.NotFound(new { error = "Document not found." });
    return Results.Ok(result);
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/copy", async (
    string areaId,
    string houseId,
    string vaultId,
    DocumentCopyRequestDto payload,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var areasRoot = ResolveAreasRoot(config);
    var result = await repo.CopyDocumentAsync(
        vaultId,
        targetCategory: payload.TargetCategory,
        targetTenantId: payload.TargetTenantId,
        targetTitle: payload.TargetTitle,
        areasRoot: areasRoot);

    if (result == null)
        return Results.NotFound(new { error = "Source document not found." });
    return Results.Ok(result);
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/reset-lock", async (
    string areaId,
    string houseId,
    string vaultId,
    IFileOrganizerRepository repo) =>
{
    var result = await repo.ResetDocumentLockAsync(vaultId);
    if (result == null)
        return Results.NotFound(new { error = "Document not found." });
    return Results.Ok(result);
});

app.MapDelete("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}", async (
    string areaId,
    string houseId,
    string vaultId,
    HttpContext httpContext,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (IsRestrictedFromDelete(httpContext))
        return Results.Json(new { status = "error", error = "Permission denied: Contributor accounts have read and upload access only and cannot delete records." }, statusCode: StatusCodes.Status403Forbidden);

    var areasRoot = ResolveAreasRoot(config);
    var success = await repo.DeleteDocumentAsync(areaId, houseId, vaultId, areasRoot);
    if (!success)
        return Results.NotFound(new { status = "error", message = "Document not found" });

    return Results.Ok(new { status = "success", message = $"Document {vaultId} deleted" });
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/batch-delete", async (
    string areaId,
    string houseId,
    BatchDeleteRequestDto dto,
    HttpContext httpContext,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (IsRestrictedFromDelete(httpContext))
        return Results.Json(new { status = "error", error = "Permission denied: Contributor accounts have read and upload access only and cannot delete records." }, statusCode: StatusCodes.Status403Forbidden);

    if (dto.VaultIds == null || dto.VaultIds.Count == 0)
        return Results.BadRequest(new { error = "vault_ids must not be empty." });

    var areasRoot = ResolveAreasRoot(config);
    var result = await repo.BatchDeleteDocumentsAsync(areaId, houseId, dto.VaultIds, areasRoot);
    return Results.Ok(result);
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/batch-move", async (
    string areaId,
    string houseId,
    BatchMoveRequestDto dto,
    IFileOrganizerRepository repo) =>
{
    if (dto.VaultIds == null || dto.VaultIds.Count == 0)
        return Results.BadRequest(new { error = "vault_ids must not be empty." });

    if (string.IsNullOrWhiteSpace(dto.TargetCategory))
        return Results.BadRequest(new { error = "target_category must not be empty." });

    var result = await repo.BatchMoveDocumentsAsync(areaId, houseId, dto.VaultIds, dto.TargetCategory, dto.TargetTenantId);
    return Results.Ok(result);
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/batch-copy", async (
    string areaId,
    string houseId,
    BatchCopyRequestDto dto,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (dto.VaultIds == null || dto.VaultIds.Count == 0)
        return Results.BadRequest(new { error = "vault_ids must not be empty." });

    if (string.IsNullOrWhiteSpace(dto.TargetCategory))
        return Results.BadRequest(new { error = "target_category must not be empty." });

    var areasRoot = ResolveAreasRoot(config);
    var result = await repo.BatchCopyDocumentsAsync(areaId, houseId, dto.VaultIds, dto.TargetCategory, dto.TargetTenantId, areasRoot);
    return Results.Ok(result);
});

// ---------------------------------------------------------------------------
// Document Merge API
// ---------------------------------------------------------------------------
app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/merge", async (
    string areaId,
    string houseId,
    MergeDocumentsRequestDto dto,
    HttpContext httpContext,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (dto.VaultIds == null || dto.VaultIds.Count < 2)
        return Results.BadRequest(new { error = "At least two documents must be selected to merge." });

    if (dto.DeleteSources && IsRestrictedFromDelete(httpContext))
        dto = dto with { DeleteSources = false };

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.MergeDocumentsAsync(areaId, houseId, dto, areasRoot);
        return Results.Ok(result);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/documents/merge", async (
    MergeDocumentsRequestDto dto,
    HttpContext httpContext,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (dto.VaultIds == null || dto.VaultIds.Count < 2)
        return Results.BadRequest(new { error = "At least two documents must be selected to merge." });

    if (dto.DeleteSources && IsRestrictedFromDelete(httpContext))
        dto = dto with { DeleteSources = false };

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.MergeDocumentsAsync("default", "default", dto, areasRoot);
        return Results.Ok(result);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

// ---------------------------------------------------------------------------
// Document Page Manipulation API (Extract, Delete, Reorder)
// ---------------------------------------------------------------------------
app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/extract-pages", async (
    string areaId,
    string houseId,
    string vaultId,
    ExtractPagesRequestDto dto,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (dto.PageNumbers == null || dto.PageNumbers.Count == 0)
        return Results.BadRequest(new { error = "page_numbers must not be empty." });

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.ExtractPagesAsync(areaId, houseId, vaultId, dto, areasRoot);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/delete-pages", async (
    string areaId,
    string houseId,
    string vaultId,
    DeletePagesRequestDto dto,
    HttpContext httpContext,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (IsRestrictedFromDelete(httpContext))
        return Results.Json(new { status = "error", error = "Permission denied: Contributor accounts have read and upload access only and cannot delete records." }, statusCode: StatusCodes.Status403Forbidden);

    if (dto.PageNumbers == null || dto.PageNumbers.Count == 0)
        return Results.BadRequest(new { error = "page_numbers must not be empty." });

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.DeletePagesAsync(areaId, houseId, vaultId, dto, areasRoot);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/reorder-pages", async (
    string areaId,
    string houseId,
    string vaultId,
    ReorderPagesRequestDto dto,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (dto.PageOrder == null || dto.PageOrder.Count == 0)
        return Results.BadRequest(new { error = "page_order must not be empty." });

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.ReorderPagesAsync(areaId, houseId, vaultId, dto, areasRoot);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/areas/{areaId}/houses/{houseId}/documents/{vaultId}/rotate-pages", async (
    string areaId,
    string houseId,
    string vaultId,
    RotatePagesRequestDto dto,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var rotations = dto.GetNormalizedRotations();
    if (rotations.Count == 0)
        return Results.BadRequest(new { error = "rotations must not be empty." });

    var normalizedDto = dto with { Rotations = rotations };
    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.RotatePagesAsync(areaId, houseId, vaultId, normalizedDto, areasRoot);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/documents/{vaultId}/extract-pages", async (
    string vaultId,
    ExtractPagesRequestDto dto,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (dto.PageNumbers == null || dto.PageNumbers.Count == 0)
        return Results.BadRequest(new { error = "page_numbers must not be empty." });

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.ExtractPagesAsync("default", "default", vaultId, dto, areasRoot);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/documents/{vaultId}/delete-pages", async (
    string vaultId,
    DeletePagesRequestDto dto,
    HttpContext httpContext,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (IsRestrictedFromDelete(httpContext))
        return Results.Json(new { status = "error", error = "Permission denied: Contributor accounts have read and upload access only and cannot delete records." }, statusCode: StatusCodes.Status403Forbidden);

    if (dto.PageNumbers == null || dto.PageNumbers.Count == 0)
        return Results.BadRequest(new { error = "page_numbers must not be empty." });

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.DeletePagesAsync("default", "default", vaultId, dto, areasRoot);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/documents/{vaultId}/reorder-pages", async (
    string vaultId,
    ReorderPagesRequestDto dto,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (dto.PageOrder == null || dto.PageOrder.Count == 0)
        return Results.BadRequest(new { error = "page_order must not be empty." });

    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.ReorderPagesAsync("default", "default", vaultId, dto, areasRoot);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/documents/{vaultId}/rotate-pages", async (
    string vaultId,
    RotatePagesRequestDto dto,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    var rotations = dto.GetNormalizedRotations();
    if (rotations.Count == 0)
        return Results.BadRequest(new { error = "rotations must not be empty." });

    var normalizedDto = dto with { Rotations = rotations };
    var areasRoot = ResolveAreasRoot(config);
    try
    {
        var result = await repo.RotatePagesAsync("default", "default", vaultId, normalizedDto, areasRoot);
        return Results.Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

// ---------------------------------------------------------------------------
// Ingest API
// ---------------------------------------------------------------------------
app.MapPost("/api/ingest/preview-ai", async (
    HttpRequest request,
    IFileOrganizerRepository repo) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest(new { error = "Expected multipart/form-data content type." });

    var form = await request.ReadFormAsync();
    var file = form.Files["file"] ?? form.Files.FirstOrDefault();
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "Uploaded file is empty or missing." });

    if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest(new { error = "Invalid file type. Only PDF files (.pdf) are supported." });

    using var stream = file.OpenReadStream();
    byte[] header = new byte[4];
    int bytesRead = await stream.ReadAsync(header, 0, 4);
    if (bytesRead < 4 || header[0] != '%' || header[1] != 'P' || header[2] != 'D' || header[3] != 'F')
        return Results.BadRequest(new { error = "Invalid file format. File does not begin with %PDF header." });

    stream.Position = 0;
    using var ms = new MemoryStream();
    await stream.CopyToAsync(ms);
    var bytes = ms.ToArray();

    var areaId = form["area_id"].FirstOrDefault();
    var houseId = form["house_id"].FirstOrDefault();

    var preview = await AIPreviewExtractor.ExtractAsync(bytes, file.FileName, areaId, houseId, repo);
    return Results.Ok(preview);
});

app.MapPost("/api/ingest", async (
    HttpRequest request,
    IFileOrganizerRepository repo,
    IConfiguration config) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest(new { error = "Expected multipart/form-data content type." });

    var form = await request.ReadFormAsync();
    var file = form.Files["file"] ?? form.Files.FirstOrDefault();
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "Uploaded file is empty or missing." });

    if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest(new { error = "Invalid file type. Only PDF files (.pdf) are supported." });

    using var stream = file.OpenReadStream();
    byte[] header = new byte[4];
    int bytesRead = await stream.ReadAsync(header, 0, 4);
    if (bytesRead < 4 || header[0] != '%' || header[1] != 'P' || header[2] != 'D' || header[3] != 'F')
        return Results.BadRequest(new { error = "Invalid file format. File does not begin with %PDF header." });

    var mode = form["mode"].FirstOrDefault() ?? "manual";
    var areaId = form["area_id"].FirstOrDefault() ?? "";
    var houseId = form["house_id"].FirstOrDefault() ?? "";

    if (string.IsNullOrWhiteSpace(areaId) || string.IsNullOrWhiteSpace(houseId))
        return Results.BadRequest(new { error = "area_id and house_id are required." });

    var cleanHouseId = TextUtils.ExtractHouseNumber(houseId);

    int? tenantId = null;
    if (int.TryParse(form["tenant_id"].FirstOrDefault(), out var tid))
        tenantId = tid;

    var tenantName = form["tenant_name"].FirstOrDefault();
    var category = form["category"].FirstOrDefault();
    var arabicTitle = form["arabic_title"].FirstOrDefault();
    var primaryDate = form["primary_date"].FirstOrDefault();
    var notes = form["notes"].FirstOrDefault();

    int? isResidentParam = null;
    if (int.TryParse(form["is_resident"].FirstOrDefault(), out var ir))
        isResidentParam = ir;
    else if (bool.TryParse(form["is_resident"].FirstOrDefault(), out var irb))
        isResidentParam = irb ? 1 : 0;

    // Resolve tenant
    int resolvedTenantId;
    TenantDto? resolvedTenant = null;
    if (tenantId.HasValue)
    {
        var tenants = await repo.GetTenantsAsync(cleanHouseId);
        var t = tenants.FirstOrDefault(x => x.Id == tenantId.Value);
        if (t == null)
            return Results.BadRequest(new { error = $"Tenant ID {tenantId.Value} does not exist or does not belong to house '{cleanHouseId}'." });
        resolvedTenantId = tenantId.Value;
        resolvedTenant = t;
    }
    else if (!string.IsNullOrWhiteSpace(tenantName))
    {
        var tenants = await repo.GetTenantsAsync(cleanHouseId);
        var matched = tenants.FirstOrDefault(x => string.Equals(x.Name.Trim(), tenantName.Trim(), StringComparison.OrdinalIgnoreCase));
        if (matched != null && matched.Id.HasValue)
        {
            resolvedTenantId = matched.Id.Value;
            resolvedTenant = matched;
        }
        else
        {
            var isRes = isResidentParam.GetValueOrDefault(1);
            var newT = await repo.AddTenantAsync(cleanHouseId, tenantName.Trim(), primaryDate, isResident: isRes);
            resolvedTenantId = newT.Id;
            resolvedTenant = new TenantDto { Id = newT.Id, Name = newT.Name, StartDate = newT.StartDate, EndDate = newT.EndDate, HouseId = cleanHouseId, IsResident = newT.IsResident, Notes = newT.Notes };
        }
    }
    else
    {
        var tenants = await repo.GetTenantsAsync(cleanHouseId);
        var firstResident = tenants.FirstOrDefault(t => t.IsResident == 1);
        if (firstResident != null && firstResident.Id.HasValue)
        {
            resolvedTenantId = firstResident.Id.Value;
            resolvedTenant = firstResident;
        }
        else if (tenants.Count > 0 && tenants[0].Id.HasValue)
        {
            resolvedTenantId = tenants[0].Id!.Value;
            resolvedTenant = tenants[0];
        }
        else
        {
            var isRes = isResidentParam.GetValueOrDefault(1);
            var defT = await repo.AddTenantAsync(cleanHouseId, "Default Tenant", primaryDate, isResident: isRes);
            resolvedTenantId = defT.Id;
            resolvedTenant = new TenantDto { Id = defT.Id, Name = defT.Name, StartDate = defT.StartDate, EndDate = defT.EndDate, HouseId = cleanHouseId, IsResident = defT.IsResident, Notes = defT.Notes };
        }
    }

    bool.TryParse(form["extend_tenant_date"].FirstOrDefault(), out var extendTenantDate);
    bool.TryParse(form["confirm_date_mismatch"].FirstOrDefault(), out var confirmDateMismatch);
    var newEndDate = form["new_end_date"].FirstOrDefault();

    if (resolvedTenant != null && resolvedTenant.IsResident == 1 && !string.IsNullOrWhiteSpace(resolvedTenant.EndDate) && !string.IsNullOrWhiteSpace(primaryDate))
    {
        if (TextUtils.IsDocDateAfterVacated(primaryDate, resolvedTenant.EndDate))
        {
            if (!extendTenantDate && !confirmDateMismatch)
            {
                return Results.BadRequest(new
                {
                    error = "tenancy_date_conflict",
                    detail = $"Tenant '{resolvedTenant.Name}' vacated on {resolvedTenant.EndDate} and you are trying to add a document dated {primaryDate}. Do you want to extend his date?",
                    tenant_id = resolvedTenant.Id,
                    tenant_name = resolvedTenant.Name,
                    end_date = resolvedTenant.EndDate,
                    document_date = primaryDate
                });
            }
            else if (extendTenantDate)
            {
                var targetEnd = !string.IsNullOrWhiteSpace(newEndDate) ? newEndDate.Trim() : primaryDate;
                if (string.Equals(targetEnd, "present", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(targetEnd, "active", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(targetEnd, "none", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(targetEnd, "null", StringComparison.OrdinalIgnoreCase) ||
                    targetEnd == "")
                {
                    targetEnd = null;
                }
                await repo.UpdateTenantDatesAsync(resolvedTenantId, null, targetEnd);
            }
        }
    }

    if (resolvedTenant != null && !string.IsNullOrWhiteSpace(primaryDate))
    {
        if (string.IsNullOrWhiteSpace(resolvedTenant.StartDate) || 
            resolvedTenant.StartDate == "1970-01-01" || 
            string.Compare(primaryDate, resolvedTenant.StartDate, StringComparison.Ordinal) < 0)
        {
            await repo.UpdateTenantDatesAsync(resolvedTenantId, primaryDate, null);
        }
    }

    var vaultId = Guid.NewGuid().ToString("N");
    var areasRootPath = ResolveAreasRoot(config);

    var tempFile = Path.GetTempFileName();
    try
    {
        stream.Position = 0;
        await using (var fs = File.Create(tempFile))
        {
            await stream.CopyToAsync(fs);
        }

        var result = await repo.AddManualDocumentAsync(new IngestRequestDto
        {
            AreaId = areaId,
            HouseId = cleanHouseId,
            TenantId = resolvedTenantId,
            Category = string.IsNullOrWhiteSpace(category) ? "13 - رسائل متنوعة" : category,
            ArabicTitle = string.IsNullOrWhiteSpace(arabicTitle) ? Path.GetFileNameWithoutExtension(file.FileName) : arabicTitle,
            PrimaryDate = primaryDate,
            Notes = notes,
            PageCount = 1,
            SourcePdfFilename = file.FileName,
            SourcePdfPath = tempFile,
            VaultId = vaultId,
            Mode = mode,
            AreasRoot = areasRootPath
        });

        return Results.Ok(result);
    }
    finally
    {
        if (File.Exists(tempFile))
        {
            try { File.Delete(tempFile); } catch { }
        }
    }
});

// ---------------------------------------------------------------------------
// Database Inspector API
// ---------------------------------------------------------------------------
app.MapGet("/api/db/info", async (IFileOrganizerRepository repo) =>
{
    var stats = await repo.GetDbStatsAsync();
    return Results.Ok(stats);
});

app.MapGet("/api/db/inspector/stats", async (IFileOrganizerRepository repo) =>
{
    var stats = await repo.GetDbStatsAsync();
    return Results.Ok(stats);
});

app.MapGet("/api/db/tables/{tableName}", async (
    string tableName,
    int? limit,
    int? offset,
    string? search,
    IFileOrganizerRepository repo) =>
{
    try
    {
        var data = await repo.GetDbTableDataAsync(tableName, limit ?? 50, offset ?? 0, search);
        return Results.Ok(data);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapGet("/api/db/inspector/{tableName}", async (
    string tableName,
    int? limit,
    int? offset,
    string? search,
    IFileOrganizerRepository repo) =>
{
    try
    {
        var data = await repo.GetDbTableDataAsync(tableName, limit ?? 50, offset ?? 0, search);
        return Results.Ok(data);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

// ---------------------------------------------------------------------------
// User & Role Management API (SuperUser-only)
// ---------------------------------------------------------------------------
app.MapGet("/api/users", async (
    HttpContext httpContext,
    IFileOrganizerRepository repo) =>
{
    var (isSuper, _) = await CheckSuperUserAccessAsync(httpContext, repo);
    if (!isSuper)
    {
        return Results.Json(
            new { error = "Super User privileges are required to view or manage user permissions." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    var users = await repo.GetAllUsersAsync();
    return Results.Ok(users);
});

app.MapPost("/api/users", async (
    CreateUserRequestDto? request,
    HttpContext httpContext,
    IFileOrganizerRepository repo) =>
{
    var (isSuper, _) = await CheckSuperUserAccessAsync(httpContext, repo);
    if (!isSuper)
    {
        return Results.Json(
            new { error = "Only the Super User can create new user accounts." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    if (request == null)
    {
        return Results.BadRequest(new { error = "Request payload is required." });
    }

    var (success, errorMessage, createdUser) = await repo.CreateUserAsync(request);
    if (!success || createdUser == null)
    {
        return Results.BadRequest(new { error = errorMessage ?? "Failed to create user." });
    }

    return Results.Created($"/api/users/{createdUser.Id}", createdUser);
});

app.MapPut("/api/users/{id:int}", async (
    int id,
    UpdateUserRequestDto? request,
    HttpContext httpContext,
    IFileOrganizerRepository repo) =>
{
    var (isSuper, _) = await CheckSuperUserAccessAsync(httpContext, repo);
    if (!isSuper)
    {
        return Results.Json(
            new { error = "Only the Super User can change user roles or account details." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    if (request == null)
    {
        return Results.BadRequest(new { error = "Request payload is required." });
    }

    var (success, errorMessage, updatedUser) = await repo.UpdateUserAsync(id, request);
    if (!success || updatedUser == null)
    {
        var isNotFound = string.Equals(errorMessage, "User not found.", StringComparison.OrdinalIgnoreCase);
        return isNotFound
            ? Results.NotFound(new { error = errorMessage })
            : Results.BadRequest(new { error = errorMessage ?? "Failed to update user." });
    }

    return Results.Ok(updatedUser);
});

app.MapDelete("/api/users/{id:int}", async (
    int id,
    HttpContext httpContext,
    IFileOrganizerRepository repo) =>
{
    var (isSuper, actingUserId) = await CheckSuperUserAccessAsync(httpContext, repo);
    if (!isSuper)
    {
        return Results.Json(
            new { error = "Only the Super User can remove user accounts." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    var (success, errorMessage) = await repo.DeleteUserAsync(id, actingUserId);
    if (!success)
    {
        var isNotFound = string.Equals(errorMessage, "User not found.", StringComparison.OrdinalIgnoreCase);
        return isNotFound
            ? Results.NotFound(new { error = errorMessage })
            : Results.BadRequest(new { error = errorMessage ?? "Failed to remove user." });
    }

    return Results.Ok(new { status = "deleted", id });
});

app.MapPost("/api/users/{id:int}/transfer-superuser", async (
    int id,
    HttpContext httpContext,
    IFileOrganizerRepository repo) =>
{
    var (isSuper, actingUserId) = await CheckSuperUserAccessAsync(httpContext, repo);
    if (!isSuper)
    {
        return Results.Json(
            new { error = "Only the current Super User can transfer Super User ownership." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    var (success, errorMessage, newSuperUser) = await repo.TransferSuperUserAsync(id);
    if (!success || newSuperUser == null)
    {
        var isNotFound = string.Equals(errorMessage, "Target user not found.", StringComparison.OrdinalIgnoreCase);
        return isNotFound
            ? Results.NotFound(new { error = errorMessage })
            : Results.BadRequest(new { error = errorMessage ?? "Failed to transfer Super User role." });
    }

    UserDto? demotedCaller = null;
    if (actingUserId.HasValue && actingUserId.Value != id)
    {
        var callerDb = await repo.GetUserByIdAsync(actingUserId.Value);
        if (callerDb != null)
        {
            demotedCaller = new UserDto
            {
                Id = callerDb.Id,
                Username = callerDb.Username,
                DisplayName = callerDb.DisplayName,
                Role = callerDb.Role,
                CreatedAt = callerDb.CreatedAt
            };

            if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                var updatedClaims = new List<Claim>
                {
                    new(ClaimTypes.NameIdentifier, callerDb.Id.ToString()),
                    new(ClaimTypes.Name, callerDb.Username),
                    new("display_name", callerDb.DisplayName),
                    new(ClaimTypes.Role, callerDb.Role),
                    new("role", callerDb.Role),
                    new("can_delete", "true"),
                    new("can_manage_users", "false")
                };
                await httpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(new ClaimsIdentity(updatedClaims, CookieAuthenticationDefaults.AuthenticationScheme)));
            }
        }
    }

    return Results.Ok(new
    {
        status = "transferred",
        newSuperUser,
        currentUser = demotedCaller ?? newSuperUser
    });
});

// ---------------------------------------------------------------------------
// Storage & Database Path Settings API (Admin-only)
// ---------------------------------------------------------------------------
app.MapGet("/api/settings/paths", async (
    HttpContext httpContext,
    IStoragePathSettingsService storageSettings,
    IFileOrganizerRepository repo) =>
{
    if (IsRestrictedFromDelete(httpContext))
    {
        return Results.Json(
            new { error = "Administrator privileges are required to view or modify storage paths." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    var settings = await storageSettings.GetCurrentSettingsAsync(repo);
    return Results.Ok(settings);
});

app.MapPost("/api/settings/paths/validate", async (
    UpdateStoragePathsRequestDto request,
    HttpContext httpContext,
    IStoragePathSettingsService storageSettings) =>
{
    if (IsRestrictedFromDelete(httpContext))
    {
        return Results.Json(
            new { error = "Administrator privileges are required to validate storage paths." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    var result = await storageSettings.ValidatePathsAsync(
        request.AreasRootPath,
        request.OrganizerDbPath,
        allowMissing: request.CreateIfMissing);
    return Results.Ok(result);
});

app.MapPut("/api/settings/paths", async (
    UpdateStoragePathsRequestDto request,
    HttpContext httpContext,
    IStoragePathSettingsService storageSettings,
    IFileOrganizerRepository repo) =>
{
    if (IsRestrictedFromDelete(httpContext))
    {
        return Results.Json(
            new { error = "Administrator privileges are required to update storage paths." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    var (success, errorMessage, updatedSettings) = await storageSettings.UpdatePathsAsync(request, repo);
    if (!success)
    {
        return Results.BadRequest(new { error = errorMessage ?? "Failed to update storage paths." });
    }

    return Results.Ok(updatedSettings);
});

app.MapGet("/api/settings/browse", (
    string? path,
    bool? includeDbFiles,
    HttpContext httpContext,
    IStoragePathSettingsService storageSettings) =>
{
    if (IsRestrictedFromDelete(httpContext))
    {
        return Results.Json(
            new { error = "Administrator privileges are required to browse server directories." },
            statusCode: StatusCodes.Status403Forbidden);
    }

    var listing = storageSettings.BrowseServerFilesystem(path, includeDbFiles ?? true);
    return Results.Ok(listing);
});

// ---------------------------------------------------------------------------
// SPA Fallback Routing
// ---------------------------------------------------------------------------
if (webRootFileProvider != null)
{
    app.MapFallbackToFile("index.html", new StaticFileOptions { FileProvider = webRootFileProvider });
}
else
{
    app.MapFallbackToFile("index.html");
}

app.Run();

public partial class Program { }
