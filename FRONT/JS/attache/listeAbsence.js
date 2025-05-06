// Variables de pagination
let currentPage = 1;
const itemsPerPage = 5;

// Fonction pour charger les données depuis le fichier JSON
async function loadData() {
    try {
        const response = await fetch('../../../BACK/data.json');
        if (!response.ok) {
            throw new Error('Erreur de chargement des données');
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur de chargement des données:", error);
        return {
            absence: [],
            cours: [],
            professeurs: [],
            modules: [],
            classes: [],
            etudiants: [],
            utilisateurs: []
        };
    }
}

// Fonction pour joindre les données et créer une vue complète des absences
function prepareAbsencesData(data) {
    if (!data) return [];

    return data.absence.map(absence => {
        // Trouver le cours correspondant
        const cours = data.cours.find(c => c.id_cours === absence.id_cours) || {};

        // Trouver le professeur du cours
        const professeur = data.professeur.find(p => p.id_professeur === cours.id_professeur) || {};
        const utilisateurProf = data.utilisateur.find(u => u.id_utilisateur === professeur.id_utilisateur) || {};

        // Trouver l'étudiant
        const etudiant = data.etudiant.find(e => e.id_etudiant === absence.id_etudiant) || {};
        const utilisateurEtudiant = data.utilisateur.find(u => u.id_utilisateur === etudiant.id_utilisateur) || {};

        // Trouver le module du cours
        const module = data.module.find(m => m.id_module === cours.id_module) || {};

        // Trouver la justification
        const justification = data.justification.find(j => j.id_absence === absence.id_absence) || {};

        // Trouver les classes associées à ce cours
        const classesAssociees = data.cours_classe
            .filter(cc => cc.id_cours === absence.id_cours)
            .map(cc => {
                const classe = data.classe.find(c => c.id_classe === cc.id_classe) || {};
                return classe.libelle;
            })
            .join(', ');

        return {
            ...absence,
            cours: {
                ...cours,
                professeur: `${utilisateurProf.prenom}`,
                module: module.libelle,
                classes: classesAssociees || 'Non assigné'
            },
            etudiant: {
                ...etudiant,
                nomComplet: `${utilisateurEtudiant.prenom} ${utilisateurEtudiant.nom}`
            },
            justification: justification.motif ? {
                ...justification,
                etat: justification.etat === 'acceptée' ? 'Acceptée' :
                    justification.etat === 'en_attente' ? 'En attente' : 'Rejetée'
            } : null
        };
    });
}

// Fonction pour afficher les absences avec pagination
function renderAbsences(absences, dateFilter = null) {
    const container = document.getElementById('cours-container');

    // Filtrer par date si un filtre est appliqué
    let filteredAbsences = absences;
    if (dateFilter) {
        filteredAbsences = absences.filter(a => a.date === dateFilter);
    }

    // Pagination : calculer les éléments à afficher en fonction de la page actuelle
    const totalItems = filteredAbsences.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAbsences = filteredAbsences.slice(startIndex, startIndex + itemsPerPage);

    if (paginatedAbsences.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center animate-pulse">
                <div class="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-inner">
                    <i class="fas fa-user-times text-4xl text-gray-300"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-700">Aucune absence enregistrée</h3>
                <p class="text-gray-400 mt-2">Les absences apparaîtront ici</p>
            </div>
        `;
        return;
    }

    container.innerHTML = paginatedAbsences.map(absence => `
        <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg border transition-all duration-500 group transform hover:-translate-y-2 border-gray-100">
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>

            <!-- Contenu principal -->
            <div class="p-5 pt-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">
                            ${absence.etudiant.nomComplet || 'Étudiant inconnu'}
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">
                            ${absence.date || 'Date non définie'}
                        </p>
                    </div>
                    <span class="bg-gray-100 shadow-inner rounded-lg px-2.5 py-1 text-sm font-medium text-gray-700">
                        ${absence.cours.heure_debut ? absence.cours.heure_debut.substring(0, 5) : '--:--'}
                        ${absence.cours.heure_fin ? absence.cours.heure_fin.substring(0, 5) : '--:--'}
                    </span>
                </div>

                <div class="grid grid-cols-3 gap-6">
                    <p class="font-medium text-purple-700 bg-purple-100 rounded text-sm text-center "> ${absence.cours.module || 'Non spécifié'}</p>
                    <p class="text-sm text-purple-700 bg-purple-100 rounded text-center ">${absence.cours.nombre_heures || 'Non assigné'}h</p>
                    <p class="text-purple-700 bg-purple-100 rounded text-sm text-center ">${absence.cours.professeur || 'Non assigné'}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Afficher les boutons de pagination
    renderPagination(totalPages);
}

// Fonction de pagination
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    let paginationHTML = '';

    if (currentPage > 1) {
        paginationHTML += `<button class="px-4 py-2 mx-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onclick="changePage(${currentPage - 1})">&laquo; Précédent</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button class="px-4 py-2 mx-1 ${i === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-lg hover:bg-blue-400" onclick="changePage(${i})">${i}</button>
        `;
    }

    if (currentPage < totalPages) {
        paginationHTML += `<button class="px-4 py-2 mx-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onclick="changePage(${currentPage + 1})">Suivant &raquo;</button>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

// Fonction pour changer de page
function changePage(page) {
    if (page < 1 || page > Math.ceil(fullAbsences.length / itemsPerPage)) return;
    currentPage = page;
    renderAbsences(fullAbsences);
}

// Initialisation de la page
async function initPage() {
    const data = await loadData();
    fullAbsences = prepareAbsencesData(data);
    renderAbsences(fullAbsences);

    // Gérer le filtre par date
    const dateFilterForm = document.getElementById('date-filter-form');
    if (dateFilterForm) {
        dateFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dateInput = dateFilterForm.querySelector('input[name="date"]');
            renderAbsences(fullAbsences, dateInput.value);
        });
    }

    // Gérer le bouton de réinitialisation
    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const dateInput = dateFilterForm.querySelector('input[name="date"]');
            dateInput.value = '';
            renderAbsences(fullAbsences);
        });
    }
}

// Lancer l'initialisation lorsque la page est chargée
document.addEventListener('DOMContentLoaded', initPage);
