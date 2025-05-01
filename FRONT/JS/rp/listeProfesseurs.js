// Variables globales
let allProfessors = [];
let currentSearch = '';
let showArchived = false;

// Chargement initial des données
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Charger les utilisateurs avec le rôle "Professeur"
        const usersResponse = await fetch('http://localhost:3000/utilisateur?role=Professeur');
        const users = await usersResponse.json();

        // Charger tous les professeurs
        const profsResponse = await fetch('http://localhost:3000/professeur');
        const profs = await profsResponse.json();

        // Combiner les données
        allProfessors = profs.map(professor => {
            const user = users.find(u => u.id_utilisateur == professor.id_utilisateur);
            return {
                ...professor,
                utilisateur: user || {}
            };
        });

        displayProfessors(allProfessors);
        setupEventListeners();
    } catch (error) {
        console.error('Erreur:', error);
        showError("Impossible de charger les données des professeurs");
    }
});

// Afficher les professeurs 
function displayProfessors(professors) {
    const container = document.getElementById('professorsContainer');

    if (!professors || professors.length === 0) {
        container.innerHTML = getNoProfessorsTemplate();
        return;
    }

    const filtered = showArchived
        ? professors.filter(p => p.archive === true)
        : professors.filter(p => !p.archive);

    if (filtered.length === 0) {
        container.innerHTML = getNoProfessorsTemplate(showArchived);
        return;
    }

    container.innerHTML = filtered.map(professor => getProfessorCardTemplate(professor)).join('');
}

// Template pour une carte de professeur
function getProfessorCardTemplate(professor) {
    const user = professor.utilisateur || {};
    const isArchived = professor.archive === true;

    return `
        <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg border transition-all duration-500 group transform hover:-translate-y-2 border border-gray-100 ${isArchived ? 'opacity-70' : ''}">
            ${isArchived ? '<div class="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Archivé</div>' : ''}
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>
            
            <div class="p-5 pt-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${user.nom || 'Non défini'}</h3>
                        <p class="text-sm text-gray-500 mt-1">${user.prenom || 'Non défini'}</p>
                    </div>
                    <span class="bg-gray-100 shadow-inner rounded-lg px-2.5 py-1 text-sm font-medium text-gray-700">
                        ${professor.specialite || 'Non défini'}
                    </span>
                </div>
                <p class="text-sm text-purple-500">${professor.grade || 'Non défini'}</p>
            </div>

            <div class="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                <button onclick="editProfessor('${professor.id_professeur}')" class="text-xs text-gray-600 hover:text-primary transition-colors">
                    ✏️ Modifier
                </button>
                <button onclick="viewProfessorClasses('${professor.id_professeur}')" 
    class="text-xs text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
    <i class="fas fa-users mr-1"></i> Voir Classes
</button>
                <button onclick="showArchiveConfirmation('${professor.id_professeur}', ${!isArchived})" 
    class="text-xs ${isArchived ? 'text-green-600 hover:text-green-800' : 'text-yellow-600 hover:text-yellow-800'} transition-colors">
    ${isArchived ? '🔄 Désarchiver' : '📂 Archiver'}
</button>
            </div>
        </div>
    `;
}


// Filtrer les professeurs
function filterProfessors() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    currentSearch = searchTerm;

    let filtered = showArchived
        ? allProfessors.filter(p => p.archive === true)
        : allProfessors.filter(p => !p.archive);

    if (searchTerm) {
        filtered = filtered.filter(professor => {
            const user = professor.utilisateur || {};
            return (
                (user.nom && user.nom.toLowerCase().includes(searchTerm)) ||
                (user.prenom && user.prenom.toLowerCase().includes(searchTerm)) ||
                (professor.specialite && professor.specialite.toLowerCase().includes(searchTerm))
            );
        });

        showSearchResultsInfo(searchTerm);
    } else {
        hideSearchResultsInfo();
    }

    displayProfessors(filtered);
}

// Afficher les informations de recherche
function showSearchResultsInfo(term) {
    const infoElement = document.getElementById('searchResultsInfo');
    const termElement = document.getElementById('currentSearchTerm');

    termElement.textContent = `"${term}"`;
    infoElement.classList.remove('hidden');
}

// Cacher les informations de recherche
function hideSearchResultsInfo() {
    document.getElementById('searchResultsInfo').classList.add('hidden');
    currentSearch = '';
}


// Afficher une erreur
function showError(message) {
    const container = document.getElementById('professorsContainer');
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

// Fonctions d'actions pour recuperer les donnees du professeur
async function editProfessor(id) {
    try {
        // Récupérer les données du professeur
        const professor = allProfessors.find(p => p.id_professeur === id);
        if (!professor) throw new Error('Professeur non trouvé');

        // Remplir le formulaire de modification
        document.getElementById('editProfessorId').value = id;
        document.getElementById('editUserId').value = professor.id_utilisateur;
        document.getElementById('editProfessorNom').value = professor.utilisateur.nom || '';
        document.getElementById('editProfessorPrenom').value = professor.utilisateur.prenom || '';
        document.getElementById('editProfessorEmail').value = professor.utilisateur.email || '';
        document.getElementById('editProfessorSpecialite').value = professor.specialite || '';
        document.getElementById('editProfessorGrade').value = professor.grade || '';

        // Charger les classes et cocher celles déjà affectées
        await loadClassesForEditModal(id);

        // Afficher le modal
        document.getElementById('editProfessorModal').classList.remove('hidden');
    } catch (error) {
        console.error('Erreur:', error);
        alert("Erreur lors de l'ouverture de la modification: " + error.message);
    }
}

// Fonction de modification d'un professeur
async function handleEditProfessorFormSubmit(e) {
    e.preventDefault();

    // Cacher les messages d'erreur
    document.querySelectorAll('[id^="editProfessor"][id$="Error"]').forEach(el => {
        el.classList.add('hidden');
    });

    // Récupération des données
    const professorId = document.getElementById('editProfessorId').value;
    const nom = document.getElementById('editProfessorNom').value.trim();
    const prenom = document.getElementById('editProfessorPrenom').value.trim();
    const email = document.getElementById('editProfessorEmail').value.trim();
    const specialite = document.getElementById('editProfessorSpecialite').value.trim();
    const grade = document.getElementById('editProfessorGrade').value.trim();
    const selectedClasses = Array.from(
        document.querySelectorAll('#editClassesCheckboxes input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);

    // Validation des champs
    let isValid = true;

    if (!nom) {
        document.getElementById('editProfessorNomError').classList.remove('hidden');
        isValid = false;
    }

    if (!prenom) {
        document.getElementById('editProfessorPrenomError').classList.remove('hidden');
        isValid = false;
    }

    if (!email) {
        document.getElementById('editProfessorEmailError').classList.remove('hidden');
        isValid = false;
    }

    if (!specialite) {
        document.getElementById('editProfessorSpecialiteError').classList.remove('hidden');
        isValid = false;
    }

    if (!grade) {
        document.getElementById('editProfessorGradeError').classList.remove('hidden');
        isValid = false;
    }

    if (!isValid) {
        const firstError = document.querySelector('[id^="editProfessor"][id$="Error"]:not(.hidden)');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    try {
        // 1. Trouver le professeur pour obtenir son ID interne
        const professorResponse = await fetch(`http://localhost:3000/professeur?id_professeur=${professorId}`);
        const professors = await professorResponse.json();

        if (professors.length === 0) throw new Error('Professeur non trouvé');

        const professor = professors[0];
        const internalProfessorId = professor.id; // ID interne utilisé par json-server

        // 2. Trouver l'utilisateur correspondant
        const userResponse = await fetch(`http://localhost:3000/utilisateur?id_utilisateur=${professor.id_utilisateur}`);
        const users = await userResponse.json();

        if (users.length === 0) throw new Error('Utilisateur non trouvé');

        const user = users[0];
        const internalUserId = user.id; // ID interne de l'utilisateur

        // 3. Mettre à jour l'utilisateur
        const updateUserResponse = await fetch(`http://localhost:3000/utilisateur/${internalUserId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nom,
                prenom,
                email
            })
        });

        if (!updateUserResponse.ok) throw new Error('Erreur lors de la modification de l\'utilisateur');

        // 4. Mettre à jour le professeur
        const updateProfessorResponse = await fetch(`http://localhost:3000/professeur/${internalProfessorId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                specialite,
                grade
            })
        });

        if (!updateProfessorResponse.ok) throw new Error('Erreur lors de la modification du professeur');

        // 5. Mettre à jour les classes
        // D'abord supprimer toutes les affectations existantes
        const professorClassesResponse = await fetch(`http://localhost:3000/professeur_classe?id_professeur=${professorId}`);
        const professorClasses = await professorClassesResponse.json();

        await Promise.all(professorClasses.map(async pc => {
            await fetch(`http://localhost:3000/professeur_classe/${pc.id}`, {
                method: 'DELETE'
            });
        }));

        // Puis ajouter les nouvelles affectations
        const classAssignments = await Promise.all(selectedClasses.map(async id_classe => {
            const response = await fetch('http://localhost:3000/professeur_classe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_professeur: professorId,
                    id_classe
                })
            });
            return response.ok;
        }));

        if (classAssignments.some(success => !success)) {
            throw new Error('Erreur lors de l\'affectation des classes');
        }

        // Recharger la liste des professeurs
        await loadAndDisplayProfessors();

        closeEditProfessorModal();
        showSuccessMessage('Professeur modifié avec succès!');

    } catch (error) {
        console.error('Erreur:', error);
        showError(`Échec de la modification: ${error.message}`);
    }
}

function closeEditProfessorModal() {
    document.getElementById('editProfessorModal').classList.add('hidden');
    document.getElementById('editProfessorForm').reset();
}

async function loadClassesForEditModal(professorId) {
    try {
        // Charger toutes les classes
        const classesResponse = await fetch('http://localhost:3000/classe');
        const classes = await classesResponse.json();

        // Charger les classes du professeur
        const professorClassesResponse = await fetch(`http://localhost:3000/professeur_classe?id_professeur=${professorId}`);
        const professorClasses = await professorClassesResponse.json();

        const container = document.getElementById('editClassesCheckboxes');
        container.innerHTML = classes.map(classe => {
            const isChecked = professorClasses.some(pc => pc.id_classe === classe.id_classe);
            return `
                <div class="flex items-center">
                    <input type="checkbox" id="editClass-${classe.id_classe}" 
                           value="${classe.id_classe}" 
                           ${isChecked ? 'checked' : ''}
                           class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                    <label for="editClass-${classe.id_classe}" class="ml-2 block text-sm text-gray-700">
                        ${classe.libelle} (${classe.filiere})
                    </label>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erreur:', error);
        showError("Impossible de charger les classes");
    }
}
function viewClasses(id) {
    console.log(`Voir classes pour professeur ${id}`);
    // window.location.href = `professor-classes.html?id=${id}`;
}

async function archiveProfessor(id) {
    if (confirm(`Voulez-vous vraiment archiver ce professeur ?`)) {
        try {
            const response = await fetch(`http://localhost:3000/professeur/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archive: true })
            });

            if (response.ok) {
                // Mettre à jour l'affichage
                const index = allProfessors.findIndex(p => p.id_professeur === id);
                if (index !== -1) {
                    allProfessors[index].archive = true;
                    filterProfessors();
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert("Erreur lors de l'archivage");
        }
    }
}

async function unarchiveProfessor(id) {
    if (confirm(`Voulez-vous vraiment désarchiver ce professeur ?`)) {
        try {
            const response = await fetch(`http://localhost:3000/professeur/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archive: false })
            });

            if (response.ok) {
                // Mettre à jour l'affichage
                const index = allProfessors.findIndex(p => p.id_professeur === id);
                if (index !== -1) {
                    allProfessors[index].archive = false;
                    filterProfessors();
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert("Erreur lors du désarchivage");
        }
    }
}
function setupEventListeners() {
    // Gestion du dropdown de filtre
    document.getElementById('filterButton').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('filterDropdown').classList.toggle('hidden');
    });

    // Fermer le dropdown quand on clique ailleurs
    document.addEventListener('click', () => {
        document.getElementById('filterDropdown').classList.add('hidden');
    });

    // Empêcher la fermeture quand on clique dans le dropdown
    document.getElementById('filterDropdown').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Recherche
    document.getElementById('searchButton').addEventListener('click', filterProfessors);
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        filterProfessors();
    });
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterProfessors();
    });

    // Bouton archivés
    document.getElementById('showArchivedBtn').addEventListener('click', () => {
        showArchived = !showArchived;
        document.getElementById('showArchivedBtn').textContent =
            showArchived ? 'Voir les actifs' : 'Voir les archivés';
        filterProfessors();
    });

    // Gestion du bouton Nouveau Professeur
    document.getElementById('addProfessorBtn').addEventListener('click', () => {
        document.getElementById('addProfessorModal').classList.remove('hidden');
        loadClassesForModal();
    });

    // Gestion de l'annulation dans le modal
    document.getElementById('cancelAddProfessor').addEventListener('click', (e) => {
        e.preventDefault();
        closeAddProfessorModal();
    });

    // Gestion de la soumission du formulaire
    document.getElementById('addProfessorForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddProfessorFormSubmit(e);
    });

    // Fermer le modal quand on clique en dehors
    document.getElementById('addProfessorModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeAddProfessorModal();
        }
    });

    // Empêcher la fermeture quand on clique dans le modal
    document.querySelector('#addProfessorModal > div').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Gestion du bouton Annuler dans le modal d'édition
    document.getElementById('cancelEditProfessor').addEventListener('click', (e) => {
        e.preventDefault();
        closeEditProfessorModal();
    });

    // Gestion de la soumission du formulaire d'édition
    document.getElementById('editProfessorForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleEditProfessorFormSubmit(e);
    });

    // Fermer le modal d'édition quand on clique en dehors
    document.getElementById('editProfessorModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeEditProfessorModal();
        }
    });

    // Empêcher la fermeture quand on clique dans le modal d'édition
    document.querySelector('#editProfessorModal > div').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Fonction pour fermer le modal d'ajout
function closeAddProfessorModal() {
    document.getElementById('addProfessorModal').classList.add('hidden');
    document.getElementById('addProfessorForm').reset();
}

// Fonction pour charger les classes dans le modal d'ajout
async function loadClassesForModal() {
    try {
        const response = await fetch('http://localhost:3000/classe');
        const classes = await response.json();

        const container = document.getElementById('classesCheckboxes');
        container.innerHTML = classes.map(classe => `
            <div class="flex items-center">
                <input type="checkbox" id="class-${classe.id_classe}" value="${classe.id_classe}" 
                       class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
                <label for="class-${classe.id_classe}" class="ml-2 block text-sm text-gray-700">
                    ${classe.libelle} (${classe.filiere})
                </label>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur:', error);
        showError("Impossible de charger les classes");
    }
}

async function getNextId(endpoint, field) {
    const response = await fetch(`http://localhost:3000/${endpoint}`);
    const data = await response.json();
    const maxId = data.reduce((max, item) => {
        const id = parseInt(item[field] || 0);
        return id > max ? id : max;
    }, 0);
    return (maxId + 1).toString();
}


// Gestionnaire de soumission du formulaire
async function handleAddProfessorFormSubmit(e) {
    e.preventDefault();

    // Cacher tous les messages d'erreur
    document.querySelectorAll('[id$="Error"]').forEach(el => {
        el.classList.add('hidden');
    });

    // Récupération des données du formulaire
    const nom = document.getElementById('professorNom').value.trim();
    const prenom = document.getElementById('professorPrenom').value.trim();
    const email = document.getElementById('professorEmail').value.trim();
    const specialite = document.getElementById('professorSpecialite').value.trim();
    const grade = document.getElementById('professorGrade').value.trim();
    const selectedClasses = Array.from(
        document.querySelectorAll('#classesCheckboxes input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);

    // Validation des champs
    let isValid = true;

    if (!nom) {
        document.getElementById('professorNomError').classList.remove('hidden');
        isValid = false;
    }

    if (!prenom) {
        document.getElementById('professorPrenomError').classList.remove('hidden');
        isValid = false;
    }

    if (!email) {
        document.getElementById('professorEmailError').classList.remove('hidden');
        isValid = false;
    }

    if (!specialite) {
        document.getElementById('professorSpecialiteError').classList.remove('hidden');
        isValid = false;
    }

    if (!grade) {
        document.getElementById('professorGradeError').classList.remove('hidden');
        isValid = false;
    }

    // Validation des classes
    if (selectedClasses.length === 0) {
        document.getElementById('classesError').classList.remove('hidden');
        isValid = false;
    }

    if (!isValid) {
        // Faire défiler jusqu'au premier champ invalide
        const firstError = document.querySelector('[id$="Error"]:not(.hidden)');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    try {
        // Générer les nouveaux IDs
        const newUserId = await getNextId('utilisateur', 'id_utilisateur');
        const newProfessorId = await getNextId('professeur', 'id_professeur');

        // 1. Créer l'utilisateur (professeur)
        const userResponse = await fetch('http://localhost:3000/utilisateur', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_utilisateur: newUserId,
                nom,
                prenom,
                email,
                role: 'Professeur',
                mot_de_passe: generateRandomPassword()
            })
        });

        if (!userResponse.ok) throw new Error('Erreur création utilisateur');
        const newUser = await userResponse.json();

        // 2. Créer le professeur
        const professorResponse = await fetch('http://localhost:3000/professeur', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_professeur: newProfessorId,
                id_utilisateur: newUserId,
                specialite,
                grade,
                archive: false
            })
        });

        if (!professorResponse.ok) throw new Error('Erreur création professeur');

        // 3. Affecter les classes au professeur
        const classAssignments = await Promise.all(selectedClasses.map(async id_classe => {
            const response = await fetch('http://localhost:3000/professeur_classe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_professeur: newProfessorId,
                    id_classe
                })
            });
            return response.ok;
        }));

        if (classAssignments.some(success => !success)) {
            throw new Error('Erreur affectation classe');
        }

        // Recharger la liste des professeurs
        await loadAndDisplayProfessors();

        closeAddProfessorModal();
        alert('Professeur ajouté avec succès!');

    } catch (error) {
        console.error('Erreur:', error);
        alert("Erreur lors de l'ajout du professeur: " + error.message);
    }
}

// Fonction pour charger et afficher les professeurs
async function loadAndDisplayProfessors() {
    const profsResponse = await fetch('http://localhost:3000/professeur');
    allProfessors = await profsResponse.json();

    const usersResponse = await fetch('http://localhost:3000/utilisateur?role=Professeur');
    const users = await usersResponse.json();

    allProfessors = allProfessors.map(professor => {
        const user = users.find(u => u.id_utilisateur == professor.id_utilisateur);
        return { ...professor, utilisateur: user || {} };
    });

    displayProfessors(allProfessors);
}
// Générer un mot de passe aléatoire
function generateRandomPassword() {
    const length = 8;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

let professorToArchive = null;

// Fonction pour afficher le modal de confirmation
function showArchiveConfirmation(professorId, isArchiving = true) {
  professorToArchive = professorId;
  const professor = allProfessors.find(p => p.id_professeur === professorId);
  
  if (!professor) return;

  const modal = document.getElementById('archiveConfirmModal');
  const title = document.getElementById('archiveModalTitle');
  const message = document.getElementById('archiveModalMessage');
  const confirmBtn = document.getElementById('archiveModalConfirmBtn');

  if (isArchiving) {
    title.textContent = 'Confirmer l\'archivage';
    message.textContent = `Êtes-vous sûr de vouloir archiver le professeur ${professor.utilisateur.prenom} ${professor.utilisateur.nom} ?`;
    confirmBtn.textContent = 'Archiver';
    confirmBtn.className = 'px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500';
  } else {
    title.textContent = 'Confirmer le désarchivage';
    message.textContent = `Êtes-vous sûr de vouloir désarchiver le professeur ${professor.utilisateur.prenom} ${professor.utilisateur.nom} ?`;
    confirmBtn.textContent = 'Désarchiver';
    confirmBtn.className = 'px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500';
  }

  modal.classList.remove('hidden');
}

// Fonction pour fermer le modal
function hideArchiveConfirmation() {
  document.getElementById('archiveConfirmModal').classList.add('hidden');
  professorToArchive = null;
}

// Fonction pour archiver/désarchiver
async function confirmArchiveProfessor() {
  if (!professorToArchive) return;

  const professor = allProfessors.find(p => p.id_professeur === professorToArchive);
  if (!professor) return;

  const isArchiving = !professor.archive;
  
  try {
    // Trouver l'ID interne du professeur
    const response = await fetch(`http://localhost:3000/professeur?id_professeur=${professorToArchive}`);
    const professors = await response.json();
    
    if (professors.length === 0) throw new Error('Professeur non trouvé');
    
    const internalId = professors[0].id;

    // Mettre à jour le statut d'archivage
    const updateResponse = await fetch(`http://localhost:3000/professeur/${internalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archive: isArchiving })
    });

    if (!updateResponse.ok) throw new Error('Erreur lors de la mise à jour');

    // Mettre à jour l'affichage
    const index = allProfessors.findIndex(p => p.id_professeur === professorToArchive);
    if (index !== -1) {
      allProfessors[index].archive = isArchiving;
      filterProfessors();
    }

    hideArchiveConfirmation();
    showSuccessMessage(`Professeur ${isArchiving ? 'archivé' : 'désarchivé'} avec succès`);
    
  } catch (error) {
    console.error('Erreur:', error);
    showError(`Échec de l'${isArchiving ? 'archivage' : 'désarchivage'}: ${error.message}`);
  }
}

// Fonction pour afficher les classes d'un professeur
async function viewProfessorClasses(professorId) {
    try {
      // Récupérer le professeur
      const professor = allProfessors.find(p => p.id_professeur === professorId);
      if (!professor) return;
  
      // Mettre à jour le titre du modal
      document.getElementById('professorClassesModalTitle').textContent = 
        `Classes de ${professor.utilisateur.prenom} ${professor.utilisateur.nom}`;
  
      // Récupérer les classes du professeur
      const response = await fetch(`http://localhost:3000/professeur_classe?id_professeur=${professorId}`);
      const professorClasses = await response.json();
  
      const container = document.getElementById('professorClassesContainer');
      container.innerHTML = '';
  
      if (professorClasses.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-8 text-center">
            <div class="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <i class="fas fa-chalkboard text-gray-400"></i>
            </div>
            <p class="text-gray-500">Ce professeur n'est associé à aucune classe</p>
          </div>
        `;
      } else {
        // Récupérer les détails de toutes les classes
        const classesResponse = await fetch('http://localhost:3000/classe');
        const allClasses = await classesResponse.json();
  
        // Afficher chaque classe
        professorClasses.forEach(pc => {
          const classe = allClasses.find(c => c.id_classe === pc.id_classe);
          if (!classe) return;
  
  
          container.innerHTML += `
            <div class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div class=" p-4">
                <h4 class="font-bold text-lg text-gray-800">${classe.libelle}</h4>
              </div>
            
            </div>
          `;
        });
      }
  
      // Afficher le modal
      document.getElementById('viewProfessorClassesModal').classList.remove('hidden');
    } catch (error) {
      console.error("Erreur:", error);
      showError("Impossible de charger les classes du professeur");
    }
  }
  
  // Fonction pour fermer le modal pour afficher les classes d'un professeur
  function closeViewProfessorClassesModal() {
    document.getElementById('viewProfessorClassesModal').classList.add('hidden');
  }
  
  // Gestion du clic en dehors du modal
  document.getElementById('viewProfessorClassesModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeViewProfessorClassesModal();
    }
  });

// Initialisation des événements
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('archiveModalConfirmBtn').addEventListener('click', confirmArchiveProfessor);
  document.getElementById('archiveModalCancelBtn').addEventListener('click', hideArchiveConfirmation);
  
  // Fermer le modal en cliquant à l'extérieur
  document.getElementById('archiveConfirmModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('archiveConfirmModal')) {
      hideArchiveConfirmation();
    }
  });
});