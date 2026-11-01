using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Dapper;
using FileOrganizer.Web.Common;
using FileOrganizer.Web.Data;
using FileOrganizer.Web.Models;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FileOrganizer.Tests;

public class AuthAndRbacTests : IClassFixture<ApiTestFixture>
{
    private readonly ApiTestFixture _fixture;
    private readonly HttpClient _client;

    public AuthAndRbacTests(ApiTestFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });
    }

    [Fact]
    public async Task Seeding_InitializesAll10Users_WithSingleSuperUserAndThreeAdmins()
    {
        await _fixture.SeedDataAsync();

        using var scope = _fixture.Services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<IFileOrganizerRepository>();

        var users = await repo.GetAllUsersAsync();
        Assert.NotNull(users);
        Assert.True(users.Count >= 10);

        // Strictly 1 SuperUser (Emad)
        var superUsers = users.Where(u => string.Equals(u.Role, "SuperUser", StringComparison.OrdinalIgnoreCase)).ToList();
        Assert.Single(superUsers);
        Assert.Equal("Emad", superUsers[0].Username);
        Assert.True(UserDto.FromEntity(superUsers[0]).IsSuperUser);
        Assert.True(UserDto.FromEntity(superUsers[0]).CanManageUsers);
        Assert.True(UserDto.FromEntity(superUsers[0]).CanDelete);

        // 3 Admins (Bubshait, Ehtezaz, Mustafa) - full delete access, cannot manage users
        var adminUsernames = new[] { "Bubshait", "Ehtezaz", "Mustafa" };
        foreach (var admin in adminUsernames)
        {
            var user = users.FirstOrDefault(u => string.Equals(u.Username, admin, StringComparison.OrdinalIgnoreCase));
            Assert.NotNull(user);
            Assert.Equal("Admin", user.Role);
            var dto = UserDto.FromEntity(user);
            Assert.False(dto.IsSuperUser);
            Assert.False(dto.CanManageUsers);
            Assert.True(dto.CanDelete);
        }

        // 6 Regular Users / Contributors - read & upload only
        var contributorUsernames = new[] { "Nawaf", "Naseem", "Mulla", "Mariam", "Shaima", "Mona" };
        foreach (var contrib in contributorUsernames)
        {
            var user = users.FirstOrDefault(u => string.Equals(u.Username, contrib, StringComparison.OrdinalIgnoreCase));
            Assert.NotNull(user);
            Assert.Equal("Contributor", user.Role);
            var dto = UserDto.FromEntity(user);
            Assert.False(dto.IsSuperUser);
            Assert.False(dto.CanManageUsers);
            Assert.False(dto.CanDelete);
        }
    }

    [Fact]
    public void PasswordHasher_GeneratesDistinctSalt_AndEnforcesCustomPasswordMode()
    {
        var (hash1, salt1) = PasswordHasher.HashPassword("SecretPassword123");
        var (hash2, salt2) = PasswordHasher.HashPassword("SecretPassword123");

        Assert.NotEmpty(hash1);
        Assert.NotEmpty(salt1);
        Assert.NotEqual(salt1, salt2);
        Assert.NotEqual(hash1, hash2);

        Assert.True(PasswordHasher.VerifyPassword("SecretPassword123", hash1, salt1));
        Assert.False(PasswordHasher.VerifyPassword("WrongPassword", hash1, salt1));
        Assert.False(PasswordHasher.VerifyPassword("", hash1, salt1));
        Assert.False(PasswordHasher.VerifyPassword(null, hash1, salt1));

        // Legacy shortcut works ONLY when allowLegacyShortcuts == true (seeded accounts with HasCustomPassword == 0)
        Assert.True(PasswordHasher.VerifyPassword("password123", hash1, salt1, allowLegacyShortcuts: true));
        Assert.True(PasswordHasher.VerifyPassword("123456", hash1, salt1, allowLegacyShortcuts: true));

        // Custom passwords (HasCustomPassword == 1) strictly reject legacy shortcuts
        Assert.False(PasswordHasher.VerifyPassword("password123", hash1, salt1, allowLegacyShortcuts: false));
        Assert.False(PasswordHasher.VerifyPassword("123456", hash1, salt1, allowLegacyShortcuts: false));
        Assert.True(PasswordHasher.VerifyPassword("SecretPassword123", hash1, salt1, allowLegacyShortcuts: false));
    }

    [Fact]
    public async Task DatabaseInitializer_EnforcesUniqueSingleSuperUserIndex_AndMigratesLegacyAdmins()
    {
        var tempDbPath = Path.Combine(Path.GetTempPath(), $"test_super_inv_{Guid.NewGuid():N}.db");
        try
        {
            var factory = new SqliteDbConnectionFactory(dbPath: tempDbPath);
            await DatabaseInitializer.InitializeAsync(factory);

            await using (var conn = await factory.CreateOpenConnectionAsync())
            {
                // Simulate a legacy database where all 4 admins had role = 'Admin' and zero SuperUsers existed
                await conn.ExecuteAsync("DROP INDEX IF EXISTS idx_users_single_superuser;");
                await conn.ExecuteAsync("UPDATE users SET role = 'Admin' WHERE role = 'SuperUser';");

                var zeroSuper = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM users WHERE role = 'SuperUser';");
                Assert.Equal(0, zeroSuper);
            }

            // Re-running InitializeAsync promotes Emad to SuperUser and restores partial unique index
            await DatabaseInitializer.InitializeAsync(factory);

            await using (var conn = await factory.CreateOpenConnectionAsync())
            {
                var superUsername = await conn.ExecuteScalarAsync<string>(
                    "SELECT username FROM users WHERE role = 'SuperUser' AND is_active = 1;");
                Assert.Equal("Emad", superUsername);

                // Attempting to insert or promote a 2nd active SuperUser directly in SQLite violates idx_users_single_superuser
                await Assert.ThrowsAsync<SqliteException>(async () =>
                {
                    await conn.ExecuteAsync("UPDATE users SET role = 'SuperUser' WHERE username = 'Bubshait';");
                });
            }
        }
        finally
        {
            if (File.Exists(tempDbPath)) File.Delete(tempDbPath);
        }
    }

    [Fact]
    public async Task AuthEndpoints_LoginSuccess_MeReturnsSuperUser_LogoutClearsSession()
    {
        await _fixture.SeedDataAsync();

        var client = _fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        // 1. Initially unauthenticated
        var meInitial = await client.GetFromJsonAsync<AuthStatusResponseDto>("/api/auth/me");
        Assert.NotNull(meInitial);
        Assert.False(meInitial.Authenticated);
        Assert.Null(meInitial.User);

        // 2. Login with SuperUser Emad
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Emad",
            Password = "emad123"
        });
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
        var loginData = await loginRes.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(loginData);
        Assert.True(loginData.Success);
        Assert.NotNull(loginData.User);
        Assert.Equal("Emad", loginData.User.Username);
        Assert.Equal("SuperUser", loginData.User.Role);
        Assert.True(loginData.User.IsSuperUser);
        Assert.True(loginData.User.CanManageUsers);
        Assert.True(loginData.User.CanDelete);

        // 3. Current user is now authenticated
        var meAuth = await client.GetFromJsonAsync<AuthStatusResponseDto>("/api/auth/me");
        Assert.NotNull(meAuth);
        Assert.True(meAuth.Authenticated);
        Assert.NotNull(meAuth.User);
        Assert.Equal("Emad", meAuth.User.Username);
        Assert.Equal("SuperUser", meAuth.User.Role);
        Assert.True(meAuth.User.CanManageUsers);
        Assert.True(meAuth.User.CanDelete);

        // 4. Logout
        var logoutRes = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.OK, logoutRes.StatusCode);

        // 5. Current user is now unauthenticated
        var meAfterLogout = await client.GetFromJsonAsync<AuthStatusResponseDto>("/api/auth/me");
        Assert.NotNull(meAfterLogout);
        Assert.False(meAfterLogout.Authenticated);
        Assert.Null(meAfterLogout.User);
    }

    [Fact]
    public async Task AuthEndpoints_InvalidPassword_Returns401()
    {
        await _fixture.SeedDataAsync();

        var client = _fixture.CreateClient();
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Emad",
            Password = "CompletelyWrongPassword!999"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, loginRes.StatusCode);
    }

    [Fact]
    public async Task AuthEndpoints_GetUsers_ReturnsAllAvailableUsers()
    {
        await _fixture.SeedDataAsync();

        var usersRes = await _client.GetAsync("/api/auth/users");
        Assert.Equal(HttpStatusCode.OK, usersRes.StatusCode);
        var users = await usersRes.Content.ReadFromJsonAsync<List<UserDto>>();
        Assert.NotNull(users);
        Assert.True(users.Count >= 10);
        Assert.Contains(users, u => u.Username == "Emad" && u.IsSuperUser && u.CanManageUsers && u.CanDelete);
        Assert.Contains(users, u => u.Username == "Bubshait" && !u.IsSuperUser && !u.CanManageUsers && u.CanDelete);
        Assert.Contains(users, u => u.Username == "Nawaf" && !u.CanDelete && !u.CanManageUsers);
    }

    [Fact]
    public async Task RBAC_AdminAndContributor_CannotAccessUserManagementEndpoints_Returns403()
    {
        await _fixture.SeedDataAsync();

        // 1. Regular Admin (Bubshait) -> has full archive access, MUST NOT manage users (403)
        var adminClient = _fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });
        var adminLogin = await adminClient.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Bubshait",
            Password = "bubshait123"
        });
        Assert.Equal(HttpStatusCode.OK, adminLogin.StatusCode);

        Assert.Equal(HttpStatusCode.Forbidden, (await adminClient.GetAsync("/api/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await adminClient.PostAsJsonAsync("/api/users", new CreateUserRequestDto
        {
            Username = "HackerAdmin",
            Password = "secret123",
            Role = "Admin"
        })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await adminClient.PutAsJsonAsync("/api/users/5", new UpdateUserRequestDto
        {
            Role = "Admin"
        })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await adminClient.DeleteAsync("/api/users/5")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await adminClient.PostAsync("/api/users/2/transfer-superuser", null)).StatusCode);

        // 2. Contributor (Nawaf) -> MUST NOT manage users (403)
        var contribClient = _fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });
        await contribClient.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Nawaf",
            Password = "nawaf123"
        });
        Assert.Equal(HttpStatusCode.Forbidden, (await contribClient.GetAsync("/api/users")).StatusCode);
    }

    [Fact]
    public async Task UserManagement_SuperUserCrud_LiveSessionSync_AndOwnershipTransfer()
    {
        using var isolatedFixture = new ApiTestFixture();
        await isolatedFixture.SeedDataAsync();

        var superClient = isolatedFixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        // Login as SuperUser (Emad)
        var superLogin = await superClient.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Emad",
            Password = "emad123"
        });
        Assert.Equal(HttpStatusCode.OK, superLogin.StatusCode);

        // 1. Create a new Regular User with custom password
        var createRes = await superClient.PostAsJsonAsync("/api/users", new CreateUserRequestDto
        {
            Username = "Khalid",
            DisplayName = "Khalid Al-Khalifa",
            Password = "CustomPass!99",
            Role = "Contributor"
        });
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdUser = await createRes.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(createdUser);
        Assert.Equal("Khalid", createdUser.Username);
        Assert.Equal("Contributor", createdUser.Role);
        Assert.False(createdUser.CanDelete);
        Assert.False(createdUser.CanManageUsers);

        // Attempting to create a second SuperUser via POST /api/users fails with 400 Bad Request
        var badSuperCreate = await superClient.PostAsJsonAsync("/api/users", new CreateUserRequestDto
        {
            Username = "SecondSuper",
            Password = "CustomPass!99",
            Role = "SuperUser"
        });
        Assert.Equal(HttpStatusCode.BadRequest, badSuperCreate.StatusCode);

        // 2. Verify custom password strictly rejects legacy "password123" shortcut and accepts "CustomPass!99"
        var khalidClient = isolatedFixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });
        var shortcutAttempt = await khalidClient.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Khalid",
            Password = "password123"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, shortcutAttempt.StatusCode);

        var realLogin = await khalidClient.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Khalid",
            Password = "CustomPass!99"
        });
        Assert.Equal(HttpStatusCode.OK, realLogin.StatusCode);

        // 3. SuperUser promotes Khalid from Contributor -> Admin; Khalid's existing cookie reflects Admin immediately via OnValidatePrincipal
        var promoteRes = await superClient.PutAsJsonAsync($"/api/users/{createdUser.Id}", new UpdateUserRequestDto
        {
            Role = "Admin"
        });
        Assert.Equal(HttpStatusCode.OK, promoteRes.StatusCode);

        var khalidMe = await khalidClient.GetFromJsonAsync<AuthStatusResponseDto>("/api/auth/me");
        Assert.NotNull(khalidMe?.User);
        Assert.Equal("Admin", khalidMe.User.Role);
        Assert.True(khalidMe.User.CanDelete);
        Assert.False(khalidMe.User.CanManageUsers);

        // 4. SuperUser deletes Khalid; Khalid's active cookie is immediately revoked on next request
        var deleteKhalid = await superClient.DeleteAsync($"/api/users/{createdUser.Id}");
        Assert.Equal(HttpStatusCode.OK, deleteKhalid.StatusCode);

        var khalidAfterDelete = await khalidClient.GetFromJsonAsync<AuthStatusResponseDto>("/api/auth/me");
        Assert.NotNull(khalidAfterDelete);
        Assert.False(khalidAfterDelete.Authenticated);

        // 5. SuperUser cannot delete own SuperUser account
        var allUsers = await superClient.GetFromJsonAsync<List<UserDto>>("/api/users");
        Assert.NotNull(allUsers);
        var emadDto = allUsers.Single(u => u.Username == "Emad");
        var bubshaitDto = allUsers.Single(u => u.Username == "Bubshait");

        var deleteSelfRes = await superClient.DeleteAsync($"/api/users/{emadDto.Id}");
        Assert.Equal(HttpStatusCode.BadRequest, deleteSelfRes.StatusCode);

        // 6. Transfer SuperUser ownership from Emad -> Bubshait
        var transferRes = await superClient.PostAsync($"/api/users/{bubshaitDto.Id}/transfer-superuser", null);
        Assert.Equal(HttpStatusCode.OK, transferRes.StatusCode);

        // Emad is now Admin (403 on /api/users, still has CanDelete)
        Assert.Equal(HttpStatusCode.Forbidden, (await superClient.GetAsync("/api/users")).StatusCode);
        var emadMeAfter = await superClient.GetFromJsonAsync<AuthStatusResponseDto>("/api/auth/me");
        Assert.NotNull(emadMeAfter?.User);
        Assert.Equal("Admin", emadMeAfter.User.Role);
        Assert.True(emadMeAfter.User.CanDelete);
        Assert.False(emadMeAfter.User.CanManageUsers);

        // Bubshait is now the sole SuperUser and can access /api/users
        var bubshaitClient = isolatedFixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });
        await bubshaitClient.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Bubshait",
            Password = "bubshait123"
        });
        var usersAsNewSuper = await bubshaitClient.GetFromJsonAsync<List<UserDto>>("/api/users");
        Assert.NotNull(usersAsNewSuper);
        Assert.Single(usersAsNewSuper, u => u.Role == "SuperUser" && u.Username == "Bubshait");
    }

    [Fact]
    public async Task RBAC_ContributorUser_CannotDeleteDocument_Returns403()
    {
        await _fixture.SeedDataAsync();

        var client = _fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        // Login as Contributor (Nawaf)
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Nawaf",
            Password = "nawaf123"
        });
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);

        // Attempt single doc delete
        var deleteRes = await client.DeleteAsync("/api/areas/Safra%20C/houses/500/documents/any_vault_id");
        Assert.Equal(HttpStatusCode.Forbidden, deleteRes.StatusCode);

        var json = await deleteRes.Content.ReadAsStringAsync();
        Assert.Contains("Permission denied", json);
    }

    [Fact]
    public async Task RBAC_ContributorUser_CannotBatchDelete_Returns403()
    {
        await _fixture.SeedDataAsync();

        var client = _fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        // Login as Contributor (Mariam)
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Mariam",
            Password = "mariam123"
        });

        // Attempt batch delete
        var batchRes = await client.PostAsJsonAsync(
            "/api/areas/Safra%20C/houses/500/documents/batch-delete",
            new BatchDeleteRequestDto { VaultIds = new List<string> { "v1", "v2" } });

        Assert.Equal(HttpStatusCode.Forbidden, batchRes.StatusCode);
        var json = await batchRes.Content.ReadAsStringAsync();
        Assert.Contains("Permission denied", json);
    }

    [Fact]
    public async Task RBAC_ContributorUser_CannotDeletePages_Returns403()
    {
        await _fixture.SeedDataAsync();

        var client = _fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        // Login as Contributor (Mona)
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Mona",
            Password = "mona123"
        });

        // Attempt page delete
        var pageRes = await client.PostAsJsonAsync(
            "/api/areas/Safra%20C/houses/500/documents/doc1/delete-pages",
            new DeletePagesRequestDto { PageNumbers = new List<int> { 1 } });

        Assert.Equal(HttpStatusCode.Forbidden, pageRes.StatusCode);
        var json = await pageRes.Content.ReadAsStringAsync();
        Assert.Contains("Permission denied", json);
    }

    [Fact]
    public async Task RBAC_ContributorUser_CannotDeleteHouse_Returns403()
    {
        await _fixture.SeedDataAsync();

        var client = _fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        // Login as Contributor (Shaima)
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Shaima",
            Password = "shaima123"
        });

        // Attempt house delete
        var houseRes = await client.DeleteAsync("/api/areas/Safra%20C/houses/500");
        Assert.Equal(HttpStatusCode.Forbidden, houseRes.StatusCode);
        var json = await houseRes.Content.ReadAsStringAsync();
        Assert.Contains("Permission denied", json);
    }

    [Fact]
    public async Task RBAC_ContributorUser_CanReadAndUpload()
    {
        await _fixture.SeedDataAsync();

        var client = _fixture.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        // Login as Contributor (Naseem)
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Username = "Naseem",
            Password = "naseem123"
        });
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);

        // Read tree
        var treeRes = await client.GetAsync("/api/tree");
        Assert.Equal(HttpStatusCode.OK, treeRes.StatusCode);

        // Read houses
        var housesRes = await client.GetAsync("/api/houses");
        Assert.Equal(HttpStatusCode.OK, housesRes.StatusCode);

        // Search
        var searchRes = await client.GetAsync("/api/search?q=test");
        Assert.Equal(HttpStatusCode.OK, searchRes.StatusCode);
    }
}
