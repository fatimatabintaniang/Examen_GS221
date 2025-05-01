// Variables globales
let data = {}; // Stockera les données chargées
let currentProfessorId = null; // ID du professeur connecté

// Fonction pour retrouver l'id_professeur via l'id_utilisateur
function getProfessorIdByUserId(userId) {
    const professeur = data.professeur.find(p => p.id_utilisateur === userId);
    return professeur ? professeur.id_professeur : null;
}

// Fonction pour charger les données depuis data.json
async function loadData() {
    try {
        const response = await fetch('../../../BACK/data.json');
        if (!response.ok) {
            throw new Error('Erreur de chargement des données');
        }
        data = await response.json();

        // Récupération de l'utilisateur connecté depuis le localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            throw new Error("Aucun utilisateur connecté.");
        }

        const user = JSON.parse(storedUser);
        const userId = user.id_utilisateur;

        currentProfessorId = getProfessorIdByUserId(userId);

        if (!currentProfessorId) {
            throw new Error('Professeur introuvable pour cet utilisateur');
        }

        initializeApp(); // Lancement après chargement
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('coursesContainer').innerHTML = `
            <div class="col-span-full py-16 text-center text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <h3 class="text-xl font-medium">Erreur de chargement des données</h3>
                <p class="mt-2">${error.message}</p>
            </div>
        `;
    }
}

// Fonction pour formater l'heure (HH:MM:SS -> HH:MM)
function formatTime(timeStr) {
    return timeStr ? timeStr.substring(0, 5) : '--:--';
}

// Fonction pour obtenir le nom du module
function getModuleName(moduleId) {
    const module = data.module.find(m => m.id_module === moduleId);
    return module ? module.libelle : 'Module inconnu';
}

// Fonction pour afficher les cours
function displayCourses(courses) {
    const container = document.getElementById('coursesContainer');

    if (!container) return;

    if (courses.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center animate-pulse">
                <div class="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-inner">
                    <i class="fas fa-chalkboard-teacher text-4xl text-gray-300"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-700">Aucun cours programmé</h3>
                <p class="text-gray-400 mt-2">Les cours apparaîtront ici</p>
            </div>
        `;
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg border transition-all duration-500 group transform hover:-translate-y-2 border border-gray-100">
            <div class="absolute top-0 left-0 w-full h-2 text-white bg-gradient-to-r from-purple-500 to-purple-700"></div>

            <div class="p-5 pt-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${course.date || 'Non défini'}</h3>
                        <p class="text-sm text-gray-500 mt-1">${course.semestre || 'Non défini'}</p>
                    </div>
                    <span class="bg-gray-100 shadow-inner rounded-lg px-2.5 py-1 text-sm font-medium text-gray-700">
                        ${formatTime(course.heure_debut)} - ${formatTime(course.heure_fin)}
                    </span>
                </div>
                <div class="mb-4 space-x-2">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ${getModuleName(course.id_module)}
                    </span>
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ${course.nombre_heures || '0'}h
                    </span>
                </div>
            </div>

            <div class="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <a href="viewClasses.html?id_cours=${course.id_cours}"
                   class="bg-purple-300 text-purple-800 px-3 py-1 rounded hover:bg-purple-400 transition-colors">
                    Voir Classe(s)
                </a>
            </div>
        </div>
    `).join('');
}

// Fonction pour filtrer les cours
function filterCourses() {
    const dateFilter = document.getElementById('dateFilter').value;
    let filteredCourses = data.cours.filter(course => course.id_professeur === currentProfessorId);

    if (dateFilter) {
        filteredCourses = filteredCourses.filter(course => course.date === dateFilter);
    }

    displayCourses(filteredCourses);
}

// Fonction pour réinitialiser le filtre
function resetFilter() {
    document.getElementById('dateFilter').value = '';
    filterCourses();
}

// Initialisation de l'application après le chargement des données
function initializeApp() {
    // Appliquer filtre si paramètre URL présent
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam) {
        document.getElementById('dateFilter').value = dateParam;
    }

    filterCourses();
}

// Démarrage
document.addEventListener('DOMContentLoaded', loadData);
