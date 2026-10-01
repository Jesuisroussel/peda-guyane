// Page de vente : comportements (fichier séparé pour la Content-Security-Policy, qui interdit les scripts en ligne).
"use strict";
// Adresse de contact du pilote : à remplacer par l'adresse professionnelle définitive.
const CONTACT = "thermidor.roussel@gmail.com";

const P = window.PEDA || {chiffres:{}, filieres:[], disciplines:{}, prix:690};
const fmt = n => n.toLocaleString("fr-FR");
const echap = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// Navigation : fond au défilement
const nav = document.getElementById("nav");
addEventListener("scroll", () => nav.classList.toggle("defile", scrollY > 40), {passive:true});

// Vidéo : si le fichier manque, un visuel de remplacement s'affiche
const video = document.getElementById("promo");
video.addEventListener("error", montrerVide, true);
video.querySelector("source").addEventListener("error", montrerVide);
function montrerVide(){ video.hidden = true; document.getElementById("video-vide").hidden = false; }

// Bandeau des filières (doublé pour une boucle continue)
const noms = P.filieres.map(f => f.nom.replace(/^Voie technologique – /, "Série "));
document.getElementById("bandeau").innerHTML = [...noms, ...noms].map(n => `<span>${echap(n)}</span>`).join("");

// Apparition au défilement, compteurs et frise
const obs = new IntersectionObserver(entrees => entrees.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("vu");
  e.target.querySelectorAll?.("[data-cle]").forEach(compter);
  if (e.target.matches("[data-cle]")) compter(e.target);
  obs.unobserve(e.target);
}), {threshold:.15, rootMargin:"0px 0px -40px 0px"});
document.querySelectorAll(".revele").forEach(el => obs.observe(el));
new IntersectionObserver(([e], o) => { if (e.isIntersecting){ e.target.style.setProperty("--prog", 1); o.disconnect(); } }, {threshold:.4})
  .observe(document.getElementById("etapes"));

const lent = matchMedia("(prefers-reduced-motion: reduce)").matches;
function compter(el){
  if (el.dataset.fait) return; el.dataset.fait = 1;
  const cible = P.chiffres[el.dataset.cle] || 0, t0 = performance.now(), duree = lent ? 0 : 1600;
  const pas = t => { const k = duree ? Math.min(1, (t - t0) / duree) : 1;
    el.textContent = fmt(Math.round(cible * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(pas); };
  requestAnimationFrame(pas);
}
if (P.genere_le) document.getElementById("date-donnees").textContent = new Date(P.genere_le + "T12:00:00").toLocaleDateString("fr-FR", {day:"numeric", month:"long", year:"numeric"});

// Catalogue : filières ou disciplines, avec recherche
let onglet = "filieres", limite = 12;
const res = document.getElementById("resultats"), champ = document.getElementById("recherche");
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function afficher(){
  const q = norm(champ.value.trim());
  let cartes = [];
  if (onglet === "filieres") {
    cartes = P.filieres.filter(f => !q || norm(f.nom + " " + f.diplomes.join(" ")).includes(q)).map(f => `
      <article class="acces"><h3>${echap(f.nom)}</h3>
      <div class="meta">${f.etablissements} établissement${f.etablissements > 1 ? "s" : ""} en Guyane · ${f.diplomes.length} texte${f.diplomes.length > 1 ? "s" : ""} officiel${f.diplomes.length > 1 ? "s" : ""}</div>
      <ul>${f.diplomes.slice(0, 5).map(d => `<li>${echap(d.length > 110 ? d.slice(0, 108) + "…" : d)}</li>`).join("")}${f.diplomes.length > 5 ? `<li>et ${f.diplomes.length - 5} autre(s)</li>` : ""}</ul></article>`);
  } else {
    for (const [voie, ds] of Object.entries(P.disciplines)) for (const d of ds) {
      if (q && !norm(voie + " " + d.nom + " " + d.niveaux.join(" ")).includes(q)) continue;
      cartes.push(`<article class="acces"><h3>${echap(d.nom)}</h3><div class="meta">${echap(voie)}</div>
        <div class="niveaux">${d.niveaux.map(n => `<span>${echap(n)}</span>`).join("")}</div></article>`);
    }
  }
  res.innerHTML = cartes.length ? cartes.slice(0, limite).join("") : `<p class="vide">Aucun accès ne correspond. Essayez un autre mot.</p>`;
  const bouton = document.getElementById("plus");
  bouton.hidden = cartes.length <= limite;
  if (!bouton.hidden) bouton.textContent = `Afficher plus (${cartes.length - limite})`;
}
document.querySelectorAll("[data-onglet]").forEach(b => b.addEventListener("click", () => {
  onglet = b.dataset.onglet; limite = 12;
  document.querySelectorAll("[data-onglet]").forEach(x => x.setAttribute("aria-selected", x === b));
  afficher();
}));
champ.addEventListener("input", () => { limite = 12; afficher(); });
document.getElementById("plus").addEventListener("click", () => { limite += 24; afficher(); });
afficher();

// Tarif
document.querySelectorAll("[data-prix]").forEach(el => el.textContent = fmt(P.prix));
document.querySelectorAll("[data-tiers]").forEach(el => el.textContent = fmt(Math.round(P.prix / 3)));
const curseur = document.getElementById("nb-acces");
curseur.addEventListener("input", () => {
  document.getElementById("nb-affiche").textContent = curseur.value;
  document.getElementById("total").textContent = fmt(curseur.value * P.prix) + " € / an";
});

// Candidature au pilote : envoyée à la plateforme quand elle est en ligne, sinon par courriel pré-rempli.
// Adresse de la plateforme, à renseigner après la mise en ligne (ex. "https://app.pedaguyane.fr").
const PLATEFORME = "";
const formPilote = document.getElementById("form-pilote");
const retourPilote = document.getElementById("retour-pilote");
formPilote.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const d = Object.fromEntries(new FormData(formPilote));
  if (!d.nom.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.courriel)) { retourPilote.textContent = "Indiquez votre nom et une adresse électronique valide."; return; }
  const bouton = document.getElementById("envoyer-pilote");
  bouton.disabled = true;
  try {
    if (!PLATEFORME) throw new Error("plateforme pas encore en ligne");
    const r = await fetch(PLATEFORME + "/api/pilote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erreur || "envoi impossible");
    retourPilote.textContent = j.message || "Merci ! Votre candidature est enregistrée.";
    formPilote.reset();
  } catch {
    // Solution de repli : un courriel pré-rempli avec les réponses.
    const corps = `Bonjour,\n\nJe souhaite participer au pilote.\nNom : ${d.nom}\nCourriel : ${d.courriel}\nCommune : ${d.commune}\nÉtablissement : ${d.etablissement}\nAccès souhaité : ${d.acces_souhaite}\n\n${d.message}`;
    location.href = `mailto:${CONTACT}?subject=${encodeURIComponent("Pilote PEDA GUYANE ASSISTANCE")}&body=${encodeURIComponent(corps)}`;
    retourPilote.textContent = "Votre messagerie s'ouvre avec votre candidature pré-remplie : il ne reste qu'à l'envoyer.";
  } finally { bouton.disabled = false; }
});
document.getElementById("annee").textContent = new Date().getFullYear();
