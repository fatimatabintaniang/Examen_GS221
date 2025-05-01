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
            justification: [],
            absence: [],
            cours: [],
            etudiant: [],
            utilisateur: []
        };
    }
}

// Fonction pour préparer les données des justifications
function prepareJustificationsData(data) {
    if (!data) return [];
    
    return data.justification.map(justification => {
        // Trouver l'absence correspondante
        const absence = data.absence.find(a => a.id_absence === justification.id_absence) || {};
        
        // Trouver le cours correspondant
        const cours = data.cours.find(c => c.id_cours === absence.id_cours) || {};
        
        // Trouver l'étudiant
        const etudiant = data.etudiant.find(e => e.id_etudiant === absence.id_etudiant) || {};
        const utilisateurEtudiant = data.utilisateur.find(u => u.id_utilisateur === etudiant.id_utilisateur) || {};
        
        return {
            id_justification: justification.id_justification,
            date: justification.date,
            motif: justification.motif,
            etat: justification.etat === 'acceptée' ? 'acceptée' : 
                  justification.etat === 'refusée' ? 'refusée' : 'attente',
            etudiant: {
                nomComplet: `${utilisateurEtudiant.prenom || ''} ${utilisateurEtudiant.nom || ''}`.trim(),
                email: utilisateurEtudiant.email || ''
            },
            cours: {
                module: cours.module || 'Non spécifié',
                date_cours: cours.date || 'Date inconnue'
            }
        };
    });
}

// Fonction pour filtrer les justifications
function filterJustifications(justifications, filter) {
    if (!filter) return justifications;
    
    switch(filter) {
        case 'attente':
            return justifications.filter(j => j.etat === 'attente');
        case 'acceptee':
            return justifications.filter(j => j.etat === 'acceptée');
        case 'refusee':
            return justifications.filter(j => j.etat === 'refusée');
        default:
            return justifications;
    }
}

// Fonction pour afficher les justifications
function renderJustifications(justifications) {
    const container = document.getElementById('justifications-container');
    
    if (!container) {
        console.error("Container des justifications introuvable");
        return;
    }

    if (justifications.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center animate-pulse">
                <div class="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-inner">
                    <i class="fas fa-file-signature text-4xl text-gray-300"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-700">Aucune justification</h3>
                <p class="text-gray-400 mt-2">Les justifications apparaîtront ici</p>
            </div>
        `;
        return;
    }

    container.innerHTML = justifications.map(justification => `
        <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-gray-100">
            <div class="absolute top-0 left-0 w-full h-2 ${
                justification.etat === 'acceptée' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                justification.etat === 'attente' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-red-500 to-orange-500'
            }"></div>
            
            <!-- Date -->
            <div class="p-5 pt-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            justification.etat === 'acceptée' ? 'bg-green-100 text-green-800' : 
                            justification.etat === 'attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }">
                            ${justification.etat}
                        </span>
                        <h3 class="text-xl font-bold text-gray-800 mt-2">
                            ${justification.date || 'Date non définie'}
                        </h3>
                    </div>
                    <span class="bg-white shadow-md rounded-lg px-2.5 py-1 text-sm font-bold text-blue-500 border border-gray-100">
                        <i class="far fa-calendar mr-1"></i> Date
                    </span>
                </div>

                <!-- Étudiant -->
                <div class="mb-3">
                    <h4 class="text-sm font-medium text-gray-500 mb-1">Étudiant :</h4>
                    <p class="text-gray-700">
                        ${justification.etudiant.nomComplet || 'Non spécifié'}
                    </p>
                </div>

                <!-- Cours -->
                <div class="mb-3">
                    <h4 class="text-sm font-medium text-gray-500 mb-1">Cours :</h4>
                    <p class="text-gray-700">
                        ${justification.cours.module || 'Non spécifié'} (${justification.cours.date_cours || 'date inconnue'})
                    </p>
                </div>

                <!-- Motif -->
                <div class="mb-4">
                    <h4 class="text-sm font-medium text-gray-500 mb-1">Motif :</h4>
                    <p class="text-gray-700 line-clamp-3">
                        ${justification.motif || 'Aucun motif fourni'}
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex space-x-3">
                    ${justification.etat === 'attente' ? `
                        <button onclick="handleJustificationAction('accept', '${justification.id_justification}')" 
                            class="w-full px-3 py-2 rounded-lg bg-gradient-to-r flex from-green-500 to-emerald-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                            <i class="fas fa-check mr-1 text-sm"></i> Accepter
                        </button>
                        <button onclick="handleJustificationAction('reject', '${justification.id_justification}')" 
                            class="w-full px-3 py-2 rounded-lg bg-gradient-to-r flex from-red-500 to-orange-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                            <i class="fas fa-times mr-1 text-sm"></i> Refuser
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Gestionnaire d'actions pour les justifications
async function handleJustificationAction(action, justificationId) {
    try {
        // Ici vous devriez faire un appel API réel
        console.log(`Action: ${action} sur justification ID: ${justificationId}`);
        
        // Simulation de succès
        alert(`Justification ${action === 'accept' ? 'acceptée' : 'refusée'} avec succès`);
        
        // Recharger les données
        initPage();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue');
    }
}

// Initialisation de la page
async function initPage() {
    // Récupérer le filtre actuel depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentFilter = urlParams.get('filter') || '';
    
    // Mettre à jour la valeur sélectionnée dans le select
    document.getElementById('filter-select').value = currentFilter;
    
    // Charger les données
    const data = await loadData();
    
    // Préparer les données des justifications
    const allJustifications = prepareJustificationsData(data);
    
    // Filtrer les justifications
    const filteredJustifications = filterJustifications(allJustifications, currentFilter);
    
    // Afficher les justifications
    renderJustifications(filteredJustifications);
}

// Gérer le changement de filtre
document.getElementById('filter-select').addEventListener('change', function() {
    const filterValue = this.value;
    const url = new URL(window.location.href);
    
    if (filterValue) {
        url.searchParams.set('filter', filterValue);
    } else {
        url.searchParams.delete('filter');
    }
    
    window.location.href = url.toString();
});

// Lancer l'initialisation quand la page est chargée
document.addEventListener('DOMContentLoaded', initPage);
