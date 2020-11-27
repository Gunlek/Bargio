﻿"use strict";

// variables globales
var interfaceAccueil = true;
var db = new Dexie("db");
var derniereSynchro = null;
var desynchronisation = false;
var timerCallback = new Timer();
var bucquageActuel = null;
var seuilHorsBabasse = 0;
var zifoysParams = {
    MiseHorsBabasseAutoActivee: false,
    MiseHorsBabasseSeuil: 0.0,
    MiseHorsBabasseInstantanee: false,
    MiseHorsBabasseQuotidienne: false,
    MiseHorsBabasseQuotidienneHeure: "00:00",
    MiseHorsBabasseHebdomadaireJours: "Mardi",
    MiseHorsBabasseHebdomadaireHeure: "00:00",
    MotDePasseZifoys: "zifoys",
    Snow: false,
    MotDesZifoys: "",
    Actualites: ""
};
var bcrypt = dcodeIO.bcrypt;
superLocal.settings.saveType = "greedy";

// Retourne la date et l'heure au format dd-mm-yyyy-HH-MM-ss
function dateTimeNow() {
    return dateFormat(new Date(), "dd-mm-yyyy-HH-MM-ss");
}

// Bargio namespace, système de log
var bargio = (function() {
    var bargio = {};

    bargio.sessionStarted = dateFormat(new Date(), "dd-mm-yyyy-HH-MM-ss");

    bargio.log = function(msg) {
        if (typeof(msg) === "undefined") {
            return;
        }
        console.log(msg);
        const prev = superLocal.fetch(bargio.sessionStarted);
        if (typeof(prev.data) !== "undefined") {
            msg = prev.data + msg;
        }
        superLocal.save(bargio.sessionStarted, msg + "\n");
    };

    bargio.downloadLogs = function() {
        const zip = new JSZip();
        const keys = Object.keys(superLocal.listAllCreated());

        for (let i = 0; i < keys.length; i++) {
            const log = superLocal.fetch(keys[i]);
            zip.file(keys[i] + ".txt", log.data);
        }

        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                saveAs(content, "bargio-logs.zip");
            });
    };

    bargio.clearLogs = function() {
        superLocal.clearAll();
    };

    return bargio;
})();

$(document).ready(function() {
    $.ajaxSetup({
        cache: false
    });

    // Passe de l'interface de bucquage à l'interface d'accueil
    function setInterfaceAccueil() {
        $("#undefined-user-alert").hide();
        $("#ui-userdata").hide();
        $("#ui-proms").slideDown(200);
        $("#ui-tarifs").hide();
        $("#ui-nums").show();
        $("#ui-solde").hide();
        $("#ui-actualites").show();
        $("#ui-historique").hide();
        $("#ui-motzifoys").show();
        $("#ui-hors-truc").hide();
        $("#inputNumss").focus();
        $("#inputNumss").val("");
        $("#input-modal-proms").val("");
        interfaceAccueil = true;
    }

    // Passe de l'interface d'accueil à l'interface de bucquage
    function setInterfaceBucquage() {
        $("#ui-proms").hide();
        $("#ui-tarifs").show();
        $("#ui-nums").hide();
        $("#ui-userdata").slideDown(200);
        $("#ui-solde").show();
        $("#ui-actualites").hide();
        $("#ui-historique").show();
        $("#ui-historique-indisponible").hide();
        $("#ui-motzifoys").hide();
        $("#ui-hors-truc").hide();
        $("#solde-en-cours").text("");
        $("#solde-commentaire").text("");
        interfaceAccueil = false;
    }

    function setDesynchro(desync) {
        if (desync) {
            bargio.log("Désynchronisation ! La babasse est-elle toujours connectée à internet ?");
            $("#logo-footer-sync").hide();
            $("#logo-footer-desync").show();
        } else {
            $("#logo-footer-desync").hide();
            $("#logo-footer-sync").show();
        }
        desynchronisation = desync;
    }

    // Créée les tables de bdd locales :
    // - UserData : sera chargée depuis le serveur,
    // contient chaque PG, son solde et son statut (hors babasse...)
    // - HistoriqueTransactions : table à synchroniser, contient tout l'historique
    // des transactions, bucquages comme rechargement
    (function() {
        db.version(1).stores({
            UserData: "UserName,HorsFoys,Surnom,Solde," +
                "FoysApiHasPassword,FoysApiPasswordHash," +
                "FoysApiPasswordSalt,ModeArchi",
            HistoriqueTransactions: "++,UserName,Date,Montant,IdProduits,Commentaire",
            HorsBabasse: "UserName"
        });
        db.version(2).stores({
            UserData: "UserName,HorsFoys,Surnom,Solde," +
                "FoysApiHasPassword,FoysApiPasswordHash," +
                "FoysApiPasswordSalt,ModeArchi",
            HistoriqueTransactions: "++,UserName,Date,Montant,IdProduits,Commentaire",
            HorsBabasse: "UserName"
        });
        db.open().catch(function(err) {
            bargio.log(`Failed to open db: ${err.stack || err}`);
        });
    })();

    // Retourne True si la touche est condamnée
    // Ex: backspace et le champ d'entrée n'est pas focus
    function isKeyForbidden(keycode) {
        if (keycode === 8 && !$("input").is(":focus")  ) {
            return true;
        }
        return false;
    }

    // Retourne une chaîne de caractère correspondant
    // à la touche passée en paramètre
    function keycodeToShortcut(keycode) {
        const raccourci = "";
        if (keycode < 112 || keycode > 123) return null;
        else return `F${keycode - 111}`;
    }

    async function isHorsBabasse(user) {
        const userHorsBabasse = await db.HorsBabasse.get({ UserName: user.UserName });
        if (userHorsBabasse !== undefined) {
            if (user.Solde >= seuilHorsBabasse) {
                // L'utilisateur n'est plus hors babasse
                db.HorsBabasse.where("UserName").equals(user.UserName).delete();
                return false;
            } else {
                return true;
            }
        } else if (user.ModeArchi && user.Solde <= 0) {
            return true;
        } else {
            return false;
        }
    }

    function isHorsFoys(user) {
        return user.HorsFoys;
    }

    function isVerouille(user) {
        return user.CompteVerrouille;
    }

    // Mises à jour asynchrones
    (function() {
        function foysApiGet() {
            db.UserData.clear().then(function() {
                $.ajax({
                    type: "GET",
                    url: "/Api/Foys",
                    cache: false,
                    success: function(response) {
                        var users = JSON.parse(response);
                        console.log(users);
                        db.UserData.bulkAdd(users).then(function() {
                            db.HistoriqueTransactions.count().then(function(count) {
                                if (count !== 0) {
                                    db.HistoriqueTransactions.toArray().then(function(arr) {
                                        arr.forEach(function(transaction) {
                                            db.UserData.get({ UserName: transaction.UserName },
                                                user => {
                                                    db.UserData.update(transaction.UserName,
                                                        {
                                                            Solde: Math.round((user.Solde + transaction.Montant) *
                                                                    100) /
                                                                100
                                                        });
                                                });
                                        });
                                    });
                                }
                            });
                            derniereSynchro = dateTimeNow();
                            window.setTimeout(function() {
                                    bargio.log(users.length +
                                        " utilisateurs ont été ajoutés" +
                                        " à la BDD locale (GET initial).");
                                    $("#ui-chargement").slideUp(200);
                                    setInterfaceAccueil();
                                },
                                10000);
                        });
                    }
                });
            });
        }

        function foysApiPostUpdates() {
            // On créée le corps de la requête POST
            var fdata = new FormData();
            db.HistoriqueTransactions.toArray().then(function(arr) {
                if (arr.length === 0) {
                    bargio.log(dateTimeNow() + ": Pas de nouvelles modifications côté client à POST");
                    timerCallback.reset();
                    return;
                }
                const json = JSON.stringify(arr);
                bargio.log(dateTimeNow() + "Envoi des données suivantes au serveur : " + json);
                fdata.append("json", json);
                $.ajax({
                    type: "POST",
                    url: "/Api/Foys/history",
                    cache: false,
                    data: fdata,
                    contentType: false,
                    processData: false,
                    success: function(response) {
                        db.HistoriqueTransactions.clear();
                        timerCallback.reset();
                    },
                    error: function(xhr, error) {
                        bargio.log(dateTimeNow() +
                            ": Impossible de synchroniser (POST)\n\t-> Erreur: " +
                            error +
                            "\n\t-> Dernière synchro réussie: " +
                            derniereSynchro);
                        timerCallback.reset();
                        setDesynchro(true);
                    }
                });
            });
        }

        function foysApiGetUpdates() {
            $.ajax({
                type: "GET",
                url: `/Api/Foys/${derniereSynchro}`,
                cache: false,
                success: function(response) {
                    // Pour chaque utilisateur modifié, on met à jour son solde
                    // et son status, et on re-applique tout son historique
                    // de transaction local
                    if (response === null) {
                        bargio.log(dateTimeNow() +
                            ": Impossible de synchroniser\n\t-> Erreur: " +
                            error +
                            "\n\t-> Dernière synchro réussie: " +
                            derniereSynchro);
                        timer.reset();
                    }
                    const arr = JSON.parse(response);
                    if (arr.length === 0) {
                        bargio.log(dateTimeNow() + ": Pas de nouvelles modifications côté serveur");
                    } else {
                        arr.forEach(function(user) {
                            bargio.log(dateTimeNow() + ": Modifications serveur sur l'utilisateur " + user.UserName);
                            var modifSoldeLocal = 0;
                            db.HistoriqueTransactions
                                .where("UserName")
                                .equals(user.UserName)
                                .each(
                                    function(transaction) {
                                        bargio.log(`\t -> ${transaction.Commentaire}: ${transaction.Montant}€`);
                                        modifSoldeLocal += transaction.Montant;
                                    }
                                ).then(function() {
                                    db.UserData.update(user.UserName,
                                        {
                                            Solde: user.Solde + modifSoldeLocal,
                                            HorsFoys: user.HorsFoys,
                                            CompteVerrouille: user.CompteVerrouille,
                                            ModeArchi: user.ModeArchi,
                                            Surnom: user.Surnom,
                                            FoysApiHasPassword: user.FoysApiHasPassword,
                                            FoysApiPasswordHash: user.FoysApiPasswordHash,
                                            FoysApiPasswordSalt: user.FoysApiPasswordSalt
                                        });
                                });
                        });
                    }
                    derniereSynchro = dateTimeNow();
                    setDesynchro(false);
                    foysApiPostUpdates();
                },
                error: function(xhr, error) {
                    bargio.log(dateTimeNow() +
                        ": Impossible de synchroniser (GET)\n\t-> Erreur: " +
                        error +
                        "\n\t-> Dernière synchro réussie: " +
                        derniereSynchro);
                    timerCallback.reset();
                    setDesynchro(true);
                },
                timeout: 3000
            });
        }

        foysApiGet();

        timerCallback.start({ countdown: true, startValues: { seconds: 30 } });
        timerCallback.addEventListener("targetAchieved",
            function(e) {
                foysApiGetUpdates();
            });
    }());

    // Objet correspondant aux bucquages en cours mais
    // pas encore validés sur la page de bucquage
    function nouveauBucquage(user) {
        return {
            userName: user.UserName,
            montant: 0.0,
            listeBucquages: [],
            genererCommentaire: function() {
                var commentaire = "";
                var nombreBucquagesParProduit = {};
                this.listeBucquages.forEach(function(x) {
                    nombreBucquagesParProduit[x] = (nombreBucquagesParProduit[x] || 0) + 1;
                });
                for (let produit in nombreBucquagesParProduit) {
                    if (nombreBucquagesParProduit.hasOwnProperty(produit)) {
                        // ex: 2 x Bière F5, 
                        const dom = $(`#table-tarifs td:contains('${produit}')`).parent();
                        commentaire += nombreBucquagesParProduit[produit] +
                            " x " +
                            dom.find(".conso-nom").text() +
                            ", ";
                    }
                }
                // On enlève le ', ' final
                return commentaire.slice(0, -2);
            },
            ajouter: function(dom) {
                this.listeBucquages.push(dom.find(".conso-id").text());
                var prix = dom.find(".conso-prix").text();
                prix = prix.replace(",", ".");
                prix = parseFloat(prix.slice(0, -1));
                this.montant -= prix;
                this.montant = Math.round(this.montant * 100) / 100;
                $("#solde-en-cours").text((this.montant.toFixed(2) + "€").replace(".", ","));
                $("#solde-commentaire").text(this.genererCommentaire());
            },
            dexieObject: function() {
                return {
                    UserName: this.userName,
                    Date: dateTimeNow(),
                    Montant: this.montant,
                    IdProduits: this.listeBucquages.join(";"),
                    Commentaire: this.genererCommentaire()
                };
            }
        };
    }

    // Fonction de gestion des inputs pour l'accueil
    function onKeydownCallbackAccueil(e) {
        // On retrouve l'identifiant du PG à travers le DOM
        e = e || e.which;
        if (isKeyForbidden(e.keyCode)) {
            e.preventDefault();
            return;
        }
            
        var keyPressed = keycodeToShortcut(e.keyCode);
        if (keyPressed === null)
            return;        

        async function changerInterface(user) {
            $("#username").text(user.UserName);
            if (user.Surnom === undefined) {
                $("#surnom").text("");
            } else {
                $("#surnom").text(user.Surnom);
            }
            $("#solde-actuel").text(user.Solde.toFixed(2).replace(".", ",") + "€");
            $("#solde-en-cours").text("0€");
            bucquageActuel = nouveauBucquage(user);

            // On affiche son historique si il n'y a pas de désynchro
            if (!desynchronisation) {
                $("#historique-indisponible").hide();
                $("#historique-disponible").show();
                $("#table-historique-consos tr").remove();
                $.ajax({
                    type: "GET",
                    url: `/Api/Foys/userhistory/${user.UserName}`,
                    cache: false,
                    success: function (response) {
                        JSON.parse(response).forEach(function(bucquage) {
                            if (bucquage.Montant > 0) {
                                bucquage.Montant = `+${bucquage.Montant.toFixed(2)}`;
                            } else if (bucquage.Montant < 0) {
                                bucquage.Montant = bucquage.Montant.toFixed(2);
                            } else {
                                return;
                            }                            
                            var nouvelleEntree = `<tr><td>${bucquage.Commentaire}</td><td>${bucquage.Montant}</td><td>${bucquage.Date
                                }</td></tr>`;
                            $("#table-historique-consos")
                                .append(nouvelleEntree);
                        });
                    }
                });
            } else {
                $("#historique-disponible").hide();
                $("#historique-indisponible").show();
            }
        }

        async function validerUtilisateur(proms) {
            proms = proms.toLowerCase();
            const username = $("#inputNumss").val() + proms;
            if (username === "") {
                return;
            }
            // On vérifie si c'est le compte admin, dans ce cas on 
            // afficher le panneau d'administration
            if (username === "admin" + zifoysParams.MotDePasseZifoys) {
                $("#modal-zifoys").modal("show");
                $("#modal-zifoys").on("hidden.bs.modal",
                    function(e) {
                        $("#inputNumss").val("");
                        $("#inputNumss").focus();
                    }
                );
                return;
            }
            // Sinon c'est un PG
            // On vérifie si il existe bien dans la BDD
            var user = await db.UserData.get({ UserName: username });
            if (username !== "admin" && typeof user === "undefined") {
                bargio.log(dateTimeNow() + ": L'utilisateur " + username + " n'existe pas.");
                $("#undefined-user-alert").slideDown(200);
                window.setTimeout(function() {
                        $("#undefined-user-alert").slideUp(200);
                    },
                    2000);
                return;
                // On vérifie si il n'est pas hors babasse
            } else if (await isHorsBabasse(user)) {
                $("#hors-babasse-solde").text(user.Solde);
                $("#message-hors-truc").text("Tu es hors babasse. :(");
                $("#ui-hors-truc").slideDown(200);
                $("#inputNumss").val("");
                $("#inputNumss").focus();
                window.setTimeout(function() {
                        $("#ui-hors-truc").slideUp(200);
                    },
                    2000);
                return;
                // On vérifie si il n'est pas hors foy's non plus le petit enculé
            } else if (isHorsFoys(user)) {
                $("#hors-babasse-solde").text(user.Solde);
                $("#message-hors-truc").text("Tu es hors foy's.");
                $("#ui-hors-truc").slideDown(200);
                $("#inputNumss").val("");
                $("#inputNumss").focus();
                window.setTimeout(function() {
                        $("#ui-hors-truc").slideUp(200);
                    },
                    2000);
                return;
            } else if (isVerouille(user)) {
                $("#hors-babasse-solde").text(user.Solde);
                $("#message-hors-truc").text("Ton compte est verouillé.");
                $("#ui-hors-truc").slideDown(200);
                $("#inputNumss").val("");
                $("#inputNumss").focus();
                window.setTimeout(function () {
                    $("#ui-hors-truc").slideUp(200);
                },
                    2000);
                return;
            } else {
                // Si il a un mdp, on lui demande de l'entrer et on compare
                if (user.FoysApiHasPassword) {
                    // attente de 100ms pour éviter le double input de touches
                    window.setTimeout(function () {
                            $("#modal-mdp").modal("show");
                            window.setTimeout(function() {
                                    $("#input-mdp").focus();
                                },
                                100);

                            $("#modal-mdp").unbind().on("keypress",
                                function (e) {
                                    const keyCode = e.keyCode || e.which;
                                    if (keyCode === 13) {
                                        $("#button-mdp").click();                                       
                                        e.preventDefault();
                                    }
                                });

                            $("#button-mdp").show();
                            $("#label-mdp-invalide").hide();
                            $("#modal-mdp").on("hidden.bs.modal",
                                function(e) {
                                    $("#input-mdp").val("");
                                }
                            );
                            $("#button-mdp").unbind().click(function(e) {
                                const pwd = $("#input-mdp").val();
                                bcrypt.compare(pwd,
                                    user.FoysApiPasswordHash,
                                    (err, res) => {
                                        if (res) {
                                            $("#modal-mdp").modal("hide");
                                            changerInterface(user);
                                            setInterfaceBucquage();
                                        } else {
                                            $("#label-mdp-invalide").slideDown(200);
                                            $("#button-mdp").hide();
                                            window.setTimeout(function() {
                                                    $("#label-mdp-invalide").slideUp(200);
                                                    $("#modal-mdp").modal("hide");
                                                    setInterfaceAccueil();
                                                },
                                                2000);
                                        }
                                    });
                            });
                        },
                        100);
                } else {
                    changerInterface(user);
                    setInterfaceBucquage();
                }
            }

        }

        e.preventDefault();
        if (keyPressed === "F1") {
            $("#button-modal-proms").click(
                function() {
                    validerUtilisateur($("#input-modal-proms").val());
                    $("#input-modal-proms").val("");
                    $("#input-modal-proms").attr("type", "text");
                    $("#inputNumss").val("");
                }
            );

            $("#modal-autre-proms").modal("show");

            // Si c'est un ID zifoys, mettre le champ en mode mdp
            if ($("#inputNumss").val() === "admin") {
                $("#input-modal-proms").attr("type", "password");
            }

            $("#modal-autre-proms").on("keyup",
                function(e) {
                    const keyCode = e.keyCode || e.which;
                    if (keyCode === 13) {
                        $("#button-modal-proms").click();
                        e.preventDefault();
                    }
                });
            setTimeout(function() {
                    $("#input-modal-proms").focus();
                },
                100);
        } else {
            const proms = $(".raccourci-proms").filter(function() {
                return $(this).text() === keyPressed;
            }).next().text();
            if (proms === "")
                return;
            validerUtilisateur(proms);
        }
    }

    // Fonction de gestion des inputs pour la page de bucquage
    function onKeydownCallbackBucquage(e) {
        e = e || e.which;
        if (e.keyCode === 27) { // ESC (annuler)
            $("#message-hors-truc").text("");
            $("#message-hors-truc").text("");
            setInterfaceAccueil();
        } else if (e.keyCode === 13) { // Enter (valider)
            var transaction = bucquageActuel.dexieObject();
            db.UserData.get({ UserName: transaction.UserName },
                user => {
                    db.UserData.update(transaction.UserName,
                        { Solde: Math.round((user.Solde + transaction.Montant) * 100) / 100 });
                }).then(function() {
                db.HistoriqueTransactions.add(transaction).then(function() {
                    bargio.log(dateTimeNow() +
                        ": " +
                        transaction.Montant +
                        " par " +
                        transaction.UserName +
                        " (" +
                        transaction.Commentaire +
                        ")");
                    $("#dernier-bucquage")
                        .text(transaction.Commentaire + " le " + transaction.Date + " par " + transaction.UserName);
                    setInterfaceAccueil();
                });
            });
        }

        const keyPressed = keycodeToShortcut(e.keyCode);
        if (keyPressed === null)
            return;
        e.preventDefault();
        const dom = $(`#table-tarifs td:contains('${keyPressed}')`).first().parent();
        bucquageActuel.ajouter(dom);
    }

    // Gestion des inputs pour un bucquage au clic
    $(".clickable-tr").click(function() {
        bucquageActuel.ajouter($(this));
    });


    // Callback pour le changement d'interface
    $(document).on("keydown",
        function(e) {
            if (interfaceAccueil)
                onKeydownCallbackAccueil(e);
            else
                onKeydownCallbackBucquage(e);
        });

    // Bugfix temporaire (qui va probablement être définitive mdr)
    // fermer la modal entrer mdp
    // ça ne fonctionne pas via bootstrap (data-dismiss)
    $("#dismiss-modal-mdp").on("click", function (e) {
        $("#modal-mdp").modal("hide");
    });

});