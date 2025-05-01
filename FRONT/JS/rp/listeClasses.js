// Variables globales
let allClasses = [];
let currentSearch = '';
let currentFilters = {
    niveau: 'all',
    filiere: 'all'
};

// Chargement initial des données
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Charger les classes depuis l'API
        const response = await fetch('http://localhost:3000/classe');
        if (!response.ok) throw new Error('Erreur de chargement des données');

        allClasses = await response.json();
        displayClasses(allClasses);
        await loadFiliereOptions();

        // Configurer les écouteurs d'événements
        setupEventListeners();
        
        // Configurer la validation en temps réel
        setupRealTimeValidation();
    } catch (error) {
        console.error('Erreur:', error);
        showError("Impossible de charger les données des classes");
    }
});

// Fonction de validation du formulaire
function validateClassForm() {
    let isValid = true;
    
    // Validation libellé
    const libelle = document.getElementById('libelle').value.trim();
    if (!libelle) {
        document.getElementById('libelleError').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('libelleError').classList.add('hidden');
    }
    
    // Validation filière
    const filiere = document.getElementById('filiere').value.trim();
    if (!filiere) {
        document.getElementById('filiereError').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('filiereError').classList.add('hidden');
    }
    
    return isValid;
}

// Fonction pour configurer la validation en temps réel
function setupRealTimeValidation() {
    // Libellé
    document.getElementById('libelle').addEventListener('input', function() {
        if (this.value.trim()) {
            document.getElementById('libelleError').classList.add('hidden');
        }
    });
    
    // Filière
    document.getElementById('filiere').addEventListener('input', function() {
        if (this.value.trim()) {
            document.getElementById('filiereError').classList.add('hidden');
        }
    });
}

// Afficher les classes
function displayClasses(classes) {
    const container = document.getElementById('classesContainer');
    
    if (!classes || classes.length === 0) {
        container.innerHTML = getNoClassesTemplate();
        return;
    }

    // Appliquer les filtres
    let filtered = classes.filter(classe => {
        const matchesNiveau = currentFilters.niveau === 'all' || classe.niveau === currentFilters.niveau;
        const matchesFiliere = currentFilters.filiere === 'all' || classe.filiere === currentFilters.filiere;
        return matchesNiveau && matchesFiliere;
    });

    // Filtrer selon la recherche
    if (currentSearch) {
        const searchTerm = currentSearch.toLowerCase();
        filtered = filtered.filter(classe => {
            return (
                (classe.libelle && classe.libelle.toLowerCase().includes(searchTerm)) ||
                (classe.filiere && classe.filiere.toLowerCase().includes(searchTerm)) ||
                (classe.niveau && classe.niveau.toLowerCase().includes(searchTerm))
            );
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = getNoClassesTemplate(true);
        return;
    }

    container.innerHTML = filtered.map(classe => getClassCardTemplate(classe)).join('');
    updateSearchResultsInfo();
}

// Template pour quand il n'y a pas de classes
function getNoClassesTemplate(isSearch = false) {
    return `
        <div class="col-span-full py-16 text-center">
            <div class="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-inner">
                <i class="fas fa-school text-4xl text-gray-300"></i>
            </div>
            <h3 class="text-xl font-medium text-gray-700">
                ${isSearch ? 'Aucune classe trouvée' : 'Aucune classe disponible'}
            </h3>
            <p class="text-gray-400 mt-2">
                ${isSearch ? 'Essayez de modifier vos critères de recherche' : 'Les classes apparaîtront ici une fois créées'}
            </p>
        </div>
    `;
}

// Template pour une carte de classe
function getClassCardTemplate(classe) {
    const isArchived = classe.archive;
    
    return `
        <div class="relative bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isArchived ? 'opacity-70' : ''}">
            ${isArchived ? `
                <div class="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    Archivée
                </div>
            ` : ''}
            
            <div class="absolute top-0 left-0 w-full h-2 ${isArchived ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-purple-600'}"></div>

            <div class="p-6 pt-8">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${classe.libelle || 'Non défini'}</h3>
                        <p class="text-sm text-gray-500 mt-1">ID: ${classe.id_classe || 'Non défini'}</p>
                    </div>
                    <div class="w-12 h-12 rounded-full ${isArchived ? 'bg-gray-200' : 'bg-purple-100'} flex items-center justify-center">
                        <i class="fas fa-chalkboard-teacher ${isArchived ? 'text-gray-500' : 'text-purple-600'}"></i>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center">
                        <i class="fas fa-graduation-cap text-gray-400 mr-2 w-5"></i>
                        <span class="text-gray-700">${classe.filiere || 'Non défini'}</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-layer-group text-gray-400 mr-2 w-5"></i>
                        <span class="text-gray-700">Niveau: ${classe.niveau || 'Non défini'}</span>
                    </div>
                </div>

                <div class="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <button onclick="viewStudents('${classe.id_classe}')" class="text-purple-600 text-sm hover:text-purple-800 flex items-center ${isArchived ? 'opacity-50 cursor-not-allowed' : ''}" ${isArchived ? 'disabled' : ''}>
                        <i class="fas fa-users mr-1"></i> Étudiants
                    </button>
                    <button onclick="editClass('${classe.id_classe}')" class="text-blue-500 text-sm hover:text-blue-700 flex items-center ${isArchived ? 'opacity-50 cursor-not-allowed' : ''}" ${isArchived ? 'disabled' : ''}>
                        <i class="fas fa-edit mr-1"></i> Modifier
                    </button>
                    <button onclick="archiveClass('${classe.id_classe}')" class="${isArchived ? 'text-gray-500' : 'text-yellow-600'} text-sm hover:text-yellow-800 flex items-center">
                        <i class="fas ${isArchived ? 'fa-undo' : 'fa-archive'} mr-1"></i> ${isArchived ? 'Désarchiver' : 'Archiver'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Mettre à jour les informations de recherche
function updateSearchResultsInfo() {
    const infoElement = document.getElementById('searchResultsInfo');
    const hasActiveFilters = currentFilters.niveau !== 'all' || currentFilters.filiere !== 'all' || currentSearch;
    
    if (hasActiveFilters) {
        infoElement.classList.remove('hidden');
        
        let filtersText = [];
        if (currentFilters.niveau !== 'all') filtersText.push(`Niveau: ${currentFilters.niveau}`);
        if (currentFilters.filiere !== 'all') filtersText.push(`Filière: ${currentFilters.filiere}`);
        if (currentSearch) filtersText.push(`Recherche: "${currentSearch}"`);
        
        document.getElementById('currentFilterTerm').textContent = filtersText.join(' | ');
    } else {
        infoElement.classList.add('hidden');
    }
}

// Réinitialiser tous les filtres
function resetFilters() {
    currentSearch = '';
    currentFilters = {
        niveau: 'all',
        filiere: 'all'
    };
    
    document.getElementById('searchInput').value = '';
    document.getElementById('filiereFilter').value = 'all';
    updateActiveFilterButtons();
    displayClasses(allClasses);
}

// Chargez les filières disponibles dynamiquement
async function loadFiliereOptions() {
    try {
        const response = await fetch('http://localhost:3000/classe');
        const classes = await response.json();
        
        const filieres = [...new Set(classes.map(c => c.filiere).filter(Boolean))];
        const select = document.getElementById('filiereFilter');
        
        select.innerHTML = '<option value="all">Toutes les filières</option>';
        
        filieres.forEach(filiere => {
            const option = document.createElement('option');
            option.value = filiere;
            option.textContent = filiere;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}


function setupEditRealTimeValidation() {
    // Libellé
    document.getElementById('editLibelle').addEventListener('input', function() {
        if (this.value.trim()) {
            document.getElementById('editLibelleError').classList.add('hidden');
        }
    });
    
    // Filière
    document.getElementById('editFiliere').addEventListener('input', function() {
        if (this.value.trim()) {
            document.getElementById('editFiliereError').classList.add('hidden');
        }
    });
}


// Configurer les écouteurs d'événements
function setupEventListeners() {
    // Bouton de filtre
    document.getElementById('filterButton').addEventListener('click', () => {
        document.getElementById('filterDropdown').classList.toggle('hidden');
    });

    // Recherche
    document.getElementById('searchButton').addEventListener('click', () => {
        currentSearch = document.getElementById('searchInput').value.trim();
        displayClasses(allClasses);
    });

    // Filtre par niveau
    document.querySelectorAll('.niveau-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilters.niveau = this.dataset.niveau;
            updateActiveFilterButtons();
            displayClasses(allClasses);
        });
    });

    // Filtre par filière
    document.getElementById('filiereFilter').addEventListener('change', function() {
        currentFilters.filiere = this.value;
        displayClasses(allClasses);
    });

    // Réinitialiser tous les filtres
    document.getElementById('clearAllFiltersBtn').addEventListener('click', resetFilters);

    // Bouton "Nouvelle Classe"
    document.getElementById('addClassBtn').addEventListener('click', openAddClassModal);

    // Bouton "Enregistrer" dans le modal d'ajout
    document.getElementById('submitClassBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await addNewClass();
    });

    // Boutons de fermeture du modal d'ajout
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.getElementById('addClassModal').classList.add('hidden');
    });

    document.getElementById('cancelModalBtn').addEventListener('click', () => {
        document.getElementById('addClassModal').classList.add('hidden');
    });

    // Bouton "Enregistrer" dans le modal d'édition
document.getElementById('submitEditClassBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await saveEditedClass();
});

// Boutons de fermeture du modal d'édition
document.getElementById('closeEditModalBtn').addEventListener('click', () => {
    document.getElementById('editClassModal').classList.add('hidden');
});

document.getElementById('cancelEditModalBtn').addEventListener('click', () => {
    document.getElementById('editClassModal').classList.add('hidden');
});
setupEditRealTimeValidation();

// Confirmation d'archivage
document.getElementById('confirmArchiveBtn').addEventListener('click', confirmArchive);

// Annulation d'archivage
document.getElementById('cancelArchiveBtn').addEventListener('click', () => {
    document.getElementById('archiveConfirmModal').classList.add('hidden');
    currentClassToArchive = null;
});

// Fermeture du modal de confirmation
document.getElementById('closeArchiveConfirmBtn').addEventListener('click', () => {
    document.getElementById('archiveConfirmModal').classList.add('hidden');
    currentClassToArchive = null;
});


}


// Mettre à jour l'UI du filtre actif
function updateActiveFilterButtons() {
    document.querySelectorAll('.niveau-btn').forEach(btn => {
        if (btn.dataset.niveau === currentFilters.niveau) {
            btn.classList.add('bg-purple-600', 'text-white');
            btn.classList.remove('bg-gray-200', 'text-gray-700');
        } else {
            btn.classList.remove('bg-purple-600', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        }
    });
}

// Afficher une erreur
function showError(message) {
    const container = document.getElementById('classesContainer');
    container.innerHTML = `
        <div class="col-span-full py-16 text-center">
            <div class="mx-auto w-28 h-28 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
            </div>
            <h3 class="text-xl font-medium text-gray-700">Erreur</h3>
            <p class="text-gray-500 mt-2">${message}</p>
        </div>
    `;
}

// Fonctions d'actions
function viewStudents(classId) {
    console.log(`Voir étudiants de la classe ${classId}`);
    window.location.href = `?controler=classe&page=voirEtudiants&id_classe=${classId}`;
}

async function editClass(classId) {
    try {
        // Trouver la classe à modifier
        const classeToEdit = allClasses.find(c => c.id_classe === classId);
        if (!classeToEdit) {
            throw new Error('Classe non trouvée');
        }

        // Remplir le formulaire avec les données actuelles
        document.getElementById('editClassId').value = classeToEdit.id_classe;
        document.getElementById('editLibelle').value = classeToEdit.libelle || '';
        document.getElementById('editFiliere').value = classeToEdit.filiere || '';
        document.getElementById('editNiveau').value = classeToEdit.niveau || 'Licence 1';

        // Réinitialiser les messages d'erreur
        document.getElementById('editLibelleError').classList.add('hidden');
        document.getElementById('editFiliereError').classList.add('hidden');
        document.getElementById('editNiveauError').classList.add('hidden');

        // Afficher le modal
        document.getElementById('editClassModal').classList.remove('hidden');

    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', "Erreur lors de l'ouverture du formulaire de modification");
    }
}

function validateEditClassForm() {
    let isValid = true;
    
    // Validation libellé
    const libelle = document.getElementById('editLibelle').value.trim();
    if (!libelle) {
        document.getElementById('editLibelleError').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('editLibelleError').classList.add('hidden');
    }
    
    // Validation filière
    const filiere = document.getElementById('editFiliere').value.trim();
    if (!filiere) {
        document.getElementById('editFiliereError').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('editFiliereError').classList.add('hidden');
    }
    
    return isValid;
}

//fonction pour sauvegarder les modifications d'une classe
async function saveEditedClass() {
    // Valider le formulaire avant soumission
    if (!validateEditClassForm()) {
        return;
    }

    const classId = document.getElementById('editClassId').value;
    const libelle = document.getElementById('editLibelle').value.trim();
    const filiere = document.getElementById('editFiliere').value.trim();
    const niveau = document.getElementById('editNiveau').value;

    try {
        // Trouver la classe dans le tableau pour obtenir son id interne
        const classeToUpdate = allClasses.find(c => c.id_classe === classId);
        if (!classeToUpdate) throw new Error('Classe non trouvée');

        const response = await fetch(`http://localhost:3000/classe/${classeToUpdate.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                libelle,
                filiere,
                niveau,
                id_classe: classId // Conserver le même id_classe
            })
        });

        if (!response.ok) throw new Error('Erreur lors de la modification');

        // Fermer le modal
        document.getElementById('editClassModal').classList.add('hidden');
        
        // Recharger les classes
        await loadClasses();
        
        showNotification('success', 'Classe modifiée avec succès!');

    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', "Erreur lors de la modification de la classe");
    }
}


//fonction pour l'archivage d'une classe
let currentClassToArchive = null;
async function archiveClass(classId) {
    currentClassToArchive = classId;
    
    // Trouver la classe pour savoir si elle est déjà archivée
    const classe = allClasses.find(c => c.id_classe === classId);
    const isArchived = classe?.archive || false;
    
    // Mettre à jour le texte du modal en fonction
    document.getElementById('archiveModalTitle').textContent = 
        isArchived ? 'Confirmer le désarchivage' : 'Confirmer l\'archivage';
    document.getElementById('archiveModalMessage').textContent = 
        isArchived 
            ? 'Êtes-vous sûr de vouloir désarchiver cette classe ?' 
            : 'Êtes-vous sûr de vouloir archiver cette classe ?';
    document.getElementById('archiveModalNote').textContent = 
        isArchived 
            ? 'La classe redeviendra active.' 
            : 'Cette action est réversible.';
    
    document.getElementById('archiveConfirmModal').classList.remove('hidden');
}



//fonction pour confirmer l'archivage d'une classe
async function confirmArchive() {
    if (!currentClassToArchive) return;
    
    try {
        // Trouver la classe dans le tableau pour obtenir son id interne
        const classeToArchive = allClasses.find(c => c.id_classe === currentClassToArchive);
        if (!classeToArchive) throw new Error('Classe non trouvée');

        const isCurrentlyArchived = classeToArchive.archive;
        const newArchiveStatus = !isCurrentlyArchived;

        const response = await fetch(`http://localhost:3000/classe/${classeToArchive.id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                archive: newArchiveStatus 
            })
        });

        if (response.ok) {
            const index = allClasses.findIndex(c => c.id_classe === currentClassToArchive);
            if (index !== -1) {
                allClasses[index].archive = newArchiveStatus;
                displayClasses(allClasses);
                showNotification('success', 
                    newArchiveStatus 
                        ? 'Classe archivée avec succès' 
                        : 'Classe désarchivée avec succès');
            }
        } else {
            throw new Error('Erreur lors de la modification');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', "Erreur lors de la modification de la classe");
    } finally {
        document.getElementById('archiveConfirmModal').classList.add('hidden');
        currentClassToArchive = null;
    }
}

// Fonction pour obtenir le prochain ID de classe
async function getNextClassId() {
    try {
        const response = await fetch('http://localhost:3000/classe');
        const classes = await response.json();

        const maxId = classes.reduce((max, classe) => {
            const id = parseInt(classe.id_classe) || 0;
            return id > max ? id : max;
        }, 0);

        return (maxId + 1).toString();
    } catch (error) {
        console.error('Erreur:', error);
        return "1";
    }
}

// Fonction pour ouvrir le modal d'ajout
async function openAddClassModal() {
    try {
        const nextId = await getNextClassId();
        document.getElementById('nextClassId').textContent = `ID sera: ${nextId}`;
        document.getElementById('classForm').reset();
        
        // Réinitialiser les messages d'erreur
        document.getElementById('libelleError').classList.add('hidden');
        document.getElementById('filiereError').classList.add('hidden');
        
        document.getElementById('addClassModal').classList.remove('hidden');
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', "Erreur lors de l'ouverture du formulaire");
    }
}

// Fonction pour ajouter une nouvelle classe
async function addNewClass() {
    // Valider le formulaire avant soumission
    if (!validateClassForm()) {
        return; // Ne pas soumettre si validation échoue
    }

    const libelle = document.getElementById('libelle').value.trim();
    const filiere = document.getElementById('filiere').value.trim();
    const niveau = document.getElementById('niveau').value;

    try {
        const nextId = await getNextClassId();

        const response = await fetch('http://localhost:3000/classe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_classe: nextId,
                libelle,
                filiere,
                niveau
            })
        });

        if (!response.ok) throw new Error('Erreur lors de la création');

        document.getElementById('addClassModal').classList.add('hidden');
        await loadClasses();
        showNotification('success', 'Classe ajoutée avec succès!');

    } catch (error) {
        console.error('Erreur:', error);
        showNotification('error', "Erreur lors de l'ajout de la classe");
    }
}

// Fonction pour charger les classes
async function loadClasses() {
    try {
        const response = await fetch('http://localhost:3000/classe');
        if (!response.ok) throw new Error('Erreur de chargement');
        
        allClasses = await response.json();
        displayClasses(allClasses);
    } catch (error) {
        console.error('Erreur:', error);
        showError("Impossible de charger les classes");
    }
}

// Fonction pour afficher des notifications
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

