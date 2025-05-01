document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));

  // const dateInput = document.getElementById('dateFilter');
  // const resetButton = document.getElementById('resetFilter');
  const container = document.getElementById('coursContainer');
  const searchInput = document.getElementById('searchInput');
  const filterForm = document.getElementById('filterForm');
  const clearFilter = document.getElementById('clearFilter');
  const noCoursMessage = document.getElementById('noCoursMessage');

  let coursEtudiant = [];

  try {
    // Récupérer l'étudiant
    const etudiantRes = await fetch(`http://localhost:3000/etudiant?id_utilisateur=${user.id_utilisateur}`);
    const etudiants = await etudiantRes.json();
    if (etudiants.length === 0) return;

    const idEtudiant = etudiants[0].id_etudiant;

    // Récupérer sa classe
    const inscriptionRes = await fetch(`http://localhost:3000/inscription?id_etudiant=${idEtudiant}`);
    const inscriptions = await inscriptionRes.json();
    if (inscriptions.length === 0) return;

    const idClasse = inscriptions[0].id_classe;

    // Récupérer les cours de la classe
    const coursClasseRes = await fetch(`http://localhost:3000/cours_classe?id_classe=${idClasse}`);
    const coursClasse = await coursClasseRes.json();
    const coursIds = coursClasse.map(cc => cc.id_cours);

    // Récupérer les cours, professeurs, modules
    const [coursRes, profsRes, modulesRes, usersRes] = await Promise.all([
      fetch(`http://localhost:3000/cours`),
      fetch(`http://localhost:3000/professeur`),
      fetch(`http://localhost:3000/module`),
      fetch(`http://localhost:3000/utilisateur`)
    ]);

    const [tousLesCours, profs, modules, utilisateurs] = await Promise.all([
      coursRes.json(),
      profsRes.json(),
      modulesRes.json(),
      usersRes.json()
    ]);

    coursEtudiant = tousLesCours
      .filter(c => coursIds.includes(c.id_cours))
      .map(c => {
        const prof = profs.find(p => p.id_professeur === c.id_professeur);
        const userProf = prof ? utilisateurs.find(u => u.id_utilisateur === prof.id_utilisateur) : null;
        const nomProf = userProf ? `${userProf.prenom} ${userProf.nom}` : 'Professeur non assigné';

        const module = modules.find(m => m.id_module === c.id_module);
        const nomModule = module ? module.libelle : 'Module';

        return { ...c, professeur: nomProf, module: nomModule };
      });

    afficherCours(coursEtudiant);

    // Filtrage par semestre
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const searchTerm = searchInput.value.toLowerCase();
      
      if (searchTerm) {
        const filtered = coursEtudiant.filter(c => 
          c.semestre && c.semestre.toLowerCase().includes(searchTerm)
        );
        afficherCours(filtered);
      } else {
        afficherCours(coursEtudiant);
      }
    });

    clearFilter.addEventListener('click', () => {
      searchInput.value = '';
      afficherCours(coursEtudiant);
    });

  } catch (err) {
    console.error('Erreur :', err);
  }

  function afficherCours(cours) {
    container.innerHTML = '';

    if (cours.length === 0) {
      noCoursMessage.classList.remove('hidden');
      return;
    } else {
      noCoursMessage.classList.add('hidden');
    }

    cours.forEach(c => {
      const card = document.createElement('div');
      card.className = "relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-gray-100";

      card.innerHTML = `
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>

        <div class="absolute top-3 right-3">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>

        <div class="p-5 pt-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-600 mb-2">
                ${c.semestre ?? 'Semestre'}
              </span>
              <h3 class="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                Cours ${c.module}
              </h3>
            </div>
            <span class="bg-white shadow-md rounded-lg px-2.5 py-1 text-sm font-bold text-purple-600 border border-gray-100">
              ${c.nombre_heures ?? 0}h
            </span>
          </div>

          <div class="flex items-center mb-5 space-x-4">
            <div class="flex items-center">
              <i class="far fa-calendar text-gray-400 mr-2"></i>
              <span class="text-sm font-medium text-gray-600">
                ${c.date ?? '--/--/----'}
              </span>
            </div>
            <div class="flex items-center">
              <i class="far fa-clock text-gray-400 mr-2"></i>
              <span class="text-sm font-medium text-gray-600">
                ${c.heure_debut ?? '--:--'} - ${c.heure_fin ?? '--:--'}
              </span>
            </div>
          </div>

          <div class="flex items-center p-3 bg-gray-50 rounded-lg group-hover:bg-purple-50 transition-colors duration-300">
            <div class="relative">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shadow-inner">
                <span class="text-xl font-bold text-purple-600">
                  ${c.professeur.charAt(0)}
                </span>
              </div>
              <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div class="ml-4">
              <h4 class="text-sm font-semibold text-gray-800">
                ${c.professeur}
              </h4>
              <p class="text-xs text-gray-500">Intervenant</p>
            </div>
          </div>
        </div>

        <div class="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div class="flex space-x-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
              <i class="fas fa-book-open mr-1 text-xs"></i> Cours
            </span>
            <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
              <i class="fas fa-university mr-1 text-xs"></i> Présentiel
            </span>
          </div>
          <button class="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors duration-300 flex items-center">
            Détails <i class="fas fa-chevron-right ml-1 text-xs"></i>
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  }
});