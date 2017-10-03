using System;
using System.Threading;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Primitives;
using AuthorizationServer.Models;
using AuthorizationServer.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Core;
using OpenIddict.Models;

namespace AuthorizationServer
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            var configuration = new ConfigurationBuilder()
                .AddJsonFile("config.json")
                .AddEnvironmentVariables()
                .Build();

            services.AddMvc();

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                // Configure the context to use Microsoft SQL Server.
                // Un-comment appropriate lines:
                options.UseSqlServer(configuration["Data:DefaultConnection:ConnectionString"]);
                // options.UseSqlServer(configuration["Data:DefaultConnection:ConnectionStringDocker"]);

                // Register the entity sets needed by OpenIddict.
                // Note: use the generic overload if you need
                // to replace the default OpenIddict entities.
                options.UseOpenIddict();
            });

            // Register the Identity services.
            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();

            // Configure Identity to use the same JWT claims as OpenIddict instead
            // of the legacy WS-Federation claims it uses by default (ClaimTypes),
            // which saves you from doing the mapping in your authorization controller.
            services.Configure<IdentityOptions>(options =>
            {
                options.ClaimsIdentity.UserNameClaimType = OpenIdConnectConstants.Claims.Name;
                options.ClaimsIdentity.UserIdClaimType = OpenIdConnectConstants.Claims.Subject;
                options.ClaimsIdentity.RoleClaimType = OpenIdConnectConstants.Claims.Role;
            });

            // Register the OpenIddict services.
            services.AddOpenIddict(options =>
            {
                // Register the Entity Framework stores.
                options.AddEntityFrameworkCoreStores<ApplicationDbContext>();

                // Register the ASP.NET Core MVC binder used by OpenIddict.
                // Note: if you don't call this method, you won't be able to
                // bind OpenIdConnectRequest or OpenIdConnectResponse parameters.
                options.AddMvcBinders();

                // Enable the authorization, logout, token and userinfo endpoints.
                options.EnableAuthorizationEndpoint("/connect/authorize")
                       .EnableLogoutEndpoint("/connect/logout")
                       .EnableTokenEndpoint("/connect/token")
                       .EnableUserinfoEndpoint("/api/userinfo");

                // Note: the Mvc.Client sample only uses the authorization code flow but you can enable
                // the other flows if you need to support implicit, password or client credentials.
                options.AllowAuthorizationCodeFlow()
                       .AllowRefreshTokenFlow();

                // When request caching is enabled, authorization and logout requests
                // are stored in the distributed cache by OpenIddict and the user agent
                // is redirected to the same page with a single parameter (request_id).
                // This allows flowing large OpenID Connect requests even when using
                // an external authentication provider like Google, Facebook or Twitter.
                options.EnableRequestCaching();

                // During development, you can disable the HTTPS requirement.
                options.DisableHttpsRequirement();

                // Note: to use JWT access tokens instead of the default
                // encrypted format, the following lines are required:
                //
                // options.UseJsonWebTokens();
                // options.AddEphemeralSigningKey();
            });

            services.AddAuthentication()
                    .AddOAuthValidation();

            // If you prefer using JWT, don't forget to disable the automatic
            // JWT -> WS-Federation claims mapping used by the JWT middleware:
            //
            // JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
            // JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();
            //
            // services.AddAuthentication()
            //     .AddJwtBearer(options =>
            //     {
            //         options.Authority = "http://localhost:54540/";
            //         options.Audience = "resource_server";
            //         options.RequireHttpsMetadata = false;
            //         options.TokenValidationParameters = new TokenValidationParameters
            //         {
            //             NameClaimType = OpenIdConnectConstants.Claims.Subject,
            //             RoleClaimType = OpenIdConnectConstants.Claims.Role
            //         };
            //     });

            // Alternatively, you can also use the introspection middleware.
            // Using it is recommended if your resource server is in a
            // different application/separated from the authorization server.
            //
            // services.AddAuthentication()
            //     .AddOAuthIntrospection(options =>
            //     {
            //         options.Authority = new Uri("http://localhost:54540/");
            //         options.Audiences.Add("resource_server");
            //         options.ClientId = "resource_server";
            //         options.ClientSecret = "875sqd4s5d748z78z7ds1ff8zz8814ff88ed8ea4z4zzd";
            //         options.RequireHttpsMetadata = false;
            //     });

            services.AddTransient<IEmailSender, AuthMessageSender>();
            services.AddTransient<ISmsSender, AuthMessageSender>();
        }

        public void Configure(IApplicationBuilder app)
        {
            app.UseDeveloperExceptionPage();

            app.UseStaticFiles();

            app.UseStatusCodePagesWithReExecute("/error");

            app.UseAuthentication();

            app.UseMvcWithDefaultRoute();

            // Seed the database with the sample applications.
            // Note: in a real world application, this step should be part of a setup script.
            InitializeAsync(app.ApplicationServices, CancellationToken.None).GetAwaiter().GetResult();
        }

        private async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken)
        {
            // Create a new service scope to ensure the database context is correctly disposed when this methods returns.
            using (var scope = services.GetRequiredService<IServiceScopeFactory>().CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await context.Database.EnsureCreatedAsync();

                var manager = scope.ServiceProvider.GetRequiredService<OpenIddictApplicationManager<OpenIddictApplication>>();

                if (await manager.FindByClientIdAsync("appClient", cancellationToken) == null)
                {
                    var application = new OpenIddictApplication
                    {
                        ClientId = "appClient",
                        DisplayName = "React Native client application",
                        LogoutRedirectUri = "oruban.appClient://logout",
                        RedirectUri = "oruban.appClient://signin-oidc"
                    };

                    await manager.CreateAsync(application, "ECF8D87D-F510-405A-96D7-4D989D177840", cancellationToken);
                }

                // To test this sample with Postman, use the following settings:
                //
                // * Authorization URL: http://localhost:54540/connect/authorize
                // * Access token URL: http://localhost:54540/connect/token
                // * Client ID: postman
                // * Client secret: [blank] (not used with public clients)
                // * Scope: openid email profile roles
                // * Grant type: authorization code
                // * Request access token locally: yes
                if (await manager.FindByClientIdAsync("postman", cancellationToken) == null)
                {
                    var application = new OpenIddictApplication
                    {
                        ClientId = "postman",
                        DisplayName = "Postman",
                        RedirectUri = "https://www.getpostman.com/oauth2/callback"
                    };

                    await manager.CreateAsync(application, cancellationToken);
                }
            }
        }
    }
}
