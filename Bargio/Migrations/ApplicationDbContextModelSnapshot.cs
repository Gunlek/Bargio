﻿//          Bargio - ApplicationDbContextModelSnapshot.cs
//  Copyright (c) Antoine Champion 2019-2019.
//  Distributed under the Boost Software License, Version 1.0.
//     (See accompanying file LICENSE_1_0.txt or copy at
//           http://www.boost.org/LICENSE_1_0.txt)

using System;
using Bargio.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Bargio.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    internal class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder) {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "2.1.4-rtm-31024")
                .HasAnnotation("Relational:MaxIdentifierLength", 128)
                .HasAnnotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn);

            modelBuilder.Entity("Bargio.Areas.Identity.IdentityUserDefaultPwd", b => {
                b.Property<string>("Id")
                    .ValueGeneratedOnAdd();

                b.Property<int>("AccessFailedCount");

                b.Property<string>("ConcurrencyStamp")
                    .IsConcurrencyToken();

                b.Property<string>("Email")
                    .HasMaxLength(256);

                b.Property<bool>("EmailConfirmed");

                b.Property<bool>("LockoutEnabled");

                b.Property<DateTimeOffset?>("LockoutEnd");

                b.Property<string>("NormalizedEmail")
                    .HasMaxLength(256);

                b.Property<string>("NormalizedUserName")
                    .HasMaxLength(256);

                b.Property<string>("Nums");

                b.Property<string>("PasswordHash");

                b.Property<string>("PhoneNumber");

                b.Property<bool>("PhoneNumberConfirmed");

                b.Property<string>("SecurityStamp");

                b.Property<bool>("TwoFactorEnabled");

                b.Property<string>("UserName")
                    .HasMaxLength(256);

                b.HasKey("Id");

                b.HasIndex("NormalizedEmail")
                    .HasName("EmailIndex");

                b.HasIndex("NormalizedUserName")
                    .IsUnique()
                    .HasName("UserNameIndex")
                    .HasFilter("[NormalizedUserName] IS NOT NULL");

                b.ToTable("AspNetUsers");
            });

            modelBuilder.Entity("Bargio.Models.PaymentRequest", b => {
                b.Property<string>("ID")
                    .ValueGeneratedOnAdd();

                b.Property<DateTime>("DateDemande");

                b.Property<decimal>("Montant");

                b.Property<string>("UserName");

                b.HasKey("ID");

                b.ToTable("PaymentRequest");
            });

            modelBuilder.Entity("Bargio.Models.Product", b => {
                b.Property<string>("Id")
                    .ValueGeneratedOnAdd();

                b.Property<long>("CompteurConsoMois");

                b.Property<long>("CompteurConsoTotal");

                b.Property<string>("Nom");

                b.Property<decimal>("Prix");

                b.Property<string>("RaccourciClavier");

                b.HasKey("Id");

                b.ToTable("Product");
            });

            modelBuilder.Entity("Bargio.Models.PromsKeyboardShortcut", b => {
                b.Property<string>("ID")
                    .ValueGeneratedOnAdd();

                b.Property<string>("Proms");

                b.Property<string>("Raccourci");

                b.Property<string>("TBK");

                b.HasKey("ID");

                b.ToTable("PromsKeyboardShortcut");
            });

            modelBuilder.Entity("Bargio.Models.SystemParameters", b => {
                b.Property<string>("Id")
                    .ValueGeneratedOnAdd();

                b.Property<string>("Actualites");

                b.Property<bool>("BucquagesBloques");

                b.Property<decimal>("CommissionLydiaFixe");

                b.Property<decimal>("CommissionLydiaVariable");

                b.Property<DateTime>("DerniereConnexionBabasse");

                b.Property<bool>("LydiaBloque");

                b.Property<bool>("Maintenance");

                b.Property<decimal>("MinimumRechargementLydia");

                b.Property<bool>("MiseHorsBabasseAutoActivee");

                b.Property<string>("MiseHorsBabasseHebdomadaireHeure");

                b.Property<string>("MiseHorsBabasseHebdomadaireJours");

                b.Property<bool>("MiseHorsBabasseInstantanee");

                b.Property<bool>("MiseHorsBabasseQuotidienne");

                b.Property<string>("MiseHorsBabasseQuotidienneHeure");

                b.Property<decimal>("MiseHorsBabasseSeuil");

                b.Property<string>("MotDePasseZifoys");

                b.Property<string>("MotDesZifoys");

                b.Property<bool>("Snow");

                b.HasKey("Id");

                b.ToTable("SystemParameters");
            });

            modelBuilder.Entity("Bargio.Models.TransactionHistory", b => {
                b.Property<string>("ID")
                    .ValueGeneratedOnAdd();

                b.Property<string>("Commentaire");

                b.Property<DateTime>("Date");

                b.Property<string>("IdProduits");

                b.Property<decimal>("Montant");

                b.Property<string>("UserName");

                b.HasKey("ID");

                b.ToTable("TransactionHistory");
            });

            modelBuilder.Entity("Bargio.Models.UserData", b => {
                b.Property<string>("UserName")
                    .ValueGeneratedOnAdd();

                b.Property<DateTime>("DateDerniereModif");

                b.Property<bool>("FoysApiHasPassword");

                b.Property<string>("FoysApiPasswordHash");

                b.Property<string>("FoysApiPasswordSalt");

                b.Property<bool>("HorsFoys");

                b.Property<bool>("ModeArchi");

                b.Property<string>("Nom");

                b.Property<string>("Nums");

                b.Property<string>("Prenom");

                b.Property<string>("Proms");

                b.Property<decimal>("Solde");

                b.Property<string>("Surnom");

                b.Property<string>("TBK");

                b.Property<string>("Telephone");

                b.HasKey("UserName");

                b.ToTable("UserData");
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRole", b => {
                b.Property<string>("Id")
                    .ValueGeneratedOnAdd();

                b.Property<string>("ConcurrencyStamp")
                    .IsConcurrencyToken();

                b.Property<string>("Name")
                    .HasMaxLength(256);

                b.Property<string>("NormalizedName")
                    .HasMaxLength(256);

                b.HasKey("Id");

                b.HasIndex("NormalizedName")
                    .IsUnique()
                    .HasName("RoleNameIndex")
                    .HasFilter("[NormalizedName] IS NOT NULL");

                b.ToTable("AspNetRoles");
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>", b => {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasAnnotation("SqlServer:ValueGenerationStrategy",
                        SqlServerValueGenerationStrategy.IdentityColumn);

                b.Property<string>("ClaimType");

                b.Property<string>("ClaimValue");

                b.Property<string>("RoleId")
                    .IsRequired();

                b.HasKey("Id");

                b.HasIndex("RoleId");

                b.ToTable("AspNetRoleClaims");
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserClaim<string>", b => {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasAnnotation("SqlServer:ValueGenerationStrategy",
                        SqlServerValueGenerationStrategy.IdentityColumn);

                b.Property<string>("ClaimType");

                b.Property<string>("ClaimValue");

                b.Property<string>("UserId")
                    .IsRequired();

                b.HasKey("Id");

                b.HasIndex("UserId");

                b.ToTable("AspNetUserClaims");
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserLogin<string>", b => {
                b.Property<string>("LoginProvider");

                b.Property<string>("ProviderKey");

                b.Property<string>("ProviderDisplayName");

                b.Property<string>("UserId")
                    .IsRequired();

                b.HasKey("LoginProvider", "ProviderKey");

                b.HasIndex("UserId");

                b.ToTable("AspNetUserLogins");
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserRole<string>", b => {
                b.Property<string>("UserId");

                b.Property<string>("RoleId");

                b.HasKey("UserId", "RoleId");

                b.HasIndex("RoleId");

                b.ToTable("AspNetUserRoles");
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserToken<string>", b => {
                b.Property<string>("UserId");

                b.Property<string>("LoginProvider");

                b.Property<string>("Name");

                b.Property<string>("Value");

                b.HasKey("UserId", "LoginProvider", "Name");

                b.ToTable("AspNetUserTokens");
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>", b => {
                b.HasOne("Microsoft.AspNetCore.Identity.IdentityRole")
                    .WithMany()
                    .HasForeignKey("RoleId")
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserClaim<string>", b => {
                b.HasOne("Bargio.Areas.Identity.IdentityUserDefaultPwd")
                    .WithMany()
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserLogin<string>", b => {
                b.HasOne("Bargio.Areas.Identity.IdentityUserDefaultPwd")
                    .WithMany()
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserRole<string>", b => {
                b.HasOne("Microsoft.AspNetCore.Identity.IdentityRole")
                    .WithMany()
                    .HasForeignKey("RoleId")
                    .OnDelete(DeleteBehavior.Cascade);

                b.HasOne("Bargio.Areas.Identity.IdentityUserDefaultPwd")
                    .WithMany()
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserToken<string>", b => {
                b.HasOne("Bargio.Areas.Identity.IdentityUserDefaultPwd")
                    .WithMany()
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.Cascade);
            });
#pragma warning restore 612, 618
        }
    }
}