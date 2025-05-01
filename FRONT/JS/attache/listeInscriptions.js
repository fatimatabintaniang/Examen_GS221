// Variables globales pour stocker les données
let appData = {
    inscription: [],
    etudiant: [],
    utilisateur: [],
    classe: [],

};

// Fonction pour générer un ID aléatoire
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

// Fonction pour générer un matricule étudiant
function generateMatricule(etudiants) {
    const lastMatricule = etudiants.reduce((max, etudiant) => {
        const num = parseInt(etudiant.matricule?.replace('ETU', '') || '0');
        return num > max ? num : max;
    }, 0);
    return `ETU${String(lastMatricule + 1).padStart(3, '0')}`;
}

// Charger les données initiales depuis le localStorage ou le fichier JSON
async function loadInitialData() {
    // Vérifier si des données existent dans le localStorage
    const savedData = localStorage.getItem('schoolManagementData');
    
    if (savedData) {
        appData = JSON.parse(savedData);
        return appData;
    }
    
    // Si aucune donnée dans le localStorage, charger depuis le fichier JSON
    try {
        const response = await fetch('../../../BACK/data.json');
        if (!response.ok) throw new Error('Erreur de chargement');
        appData = await response.json();
        // Sauvegarder dans le localStorage pour la prochaine fois
        localStorage.setItem('schoolManagementData', JSON.stringify(appData));
        return appData;
    } catch (error) {
        console.error("Erreur de chargement:", error);
        return appData;
    }
}

// Sauvegarder les données dans le localStorage
function saveDataToLocalStorage() {
    try {
        localStorage.setItem('schoolManagementData', JSON.stringify(appData));
        return true;
    } catch (error) {
        console.error("Erreur de sauvegarde:", error);
        return false;
    }
}

// Préparer les données des inscriptions avec les jointures
function prepareInscriptionsData() {
    return appData.inscription.map(inscription => {
        const etudiant = appData.etudiant.find(e => e.id_etudiant === inscription.id_etudiant) || {};
        const utilisateur = appData.utilisateur.find(u => u.id_utilisateur === etudiant.id_utilisateur) || {};
        const classe = appData.classe.find(c => c.id_classe === inscription.id_classe) || {};
        
        return {
            ...inscription,
            etudiant: {
                ...etudiant,
                utilisateur
            },
            classe
        };
    });
}

// Afficher les classes dans les selects
function renderClasses() {
    const filterSelect = document.getElementById('classe-filter');
    const modalSelect = document.getElementById('studentClasse');
    
    // Réinitialiser les selects
    filterSelect.innerHTML = '<option value="">Toutes les classes</option>';
    modalSelect.innerHTML = '<option value="">Sélectionnez une classe</option>';
    
    // Ajouter les classes
    appData.classe.forEach(classe => {
        const optionText = `${classe.libelle} (${classe.niveau})`;
        
        // Pour le filtre
        const filterOption = document.createElement('option');
        filterOption.value = classe.id_classe;
        filterOption.textContent = optionText;
        filterSelect.appendChild(filterOption);
        
        // Pour le modal
        const modalOption = document.createElement('option');
        modalOption.value = classe.id_classe;
        modalOption.textContent = optionText;
        modalSelect.appendChild(modalOption);
    });
}

// Afficher les inscriptions
function renderInscriptions(inscriptions) {
    const container = document.getElementById('inscriptions-container');
    
    if (!inscriptions || inscriptions.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center">
                <div class="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-inner">
                    <i class="fas fa-calendar-alt text-4xl text-gray-300"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-700">Aucun étudiant inscrit</h3>
                <p class="text-gray-400 mt-2">les inscrits apparaîtront ici</p>
            </div>
        `;
        return;
    }

    container.innerHTML = inscriptions.map(inscription => `
        <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-gray-100">
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>

            <div class="p-5 pt-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors duration-300">
                            ${inscription.etudiant.utilisateur?.prenom || 'Prénom'} ${inscription.etudiant.utilisateur?.nom || 'Nom'}
                        </h3>
                        <p class="text-sm text-gray-500">${inscription.etudiant.utilisateur?.email || 'Email non disponible'}</p>
                    </div>

                    <span class="bg-white shadow-md rounded-lg px-2.5 py-1 text-sm font-bold text-primary border border-gray-100">
                        ${inscription.etudiant?.matricule || 'N/A'}
                    </span>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div class="p-2 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-500">Adresse</p>
                        <p class="text-sm font-medium">${inscription.etudiant?.adresse || 'Non renseignée'}</p>
                    </div>
                    
                    <div class="p-2 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-500">Classe</p>
                        <p class="text-sm font-medium">${inscription.classe?.libelle || 'Non définie'}</p>
                    </div>
                    
                    <div class="p-2 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-500">Filière</p>
                        <p class="text-sm font-medium">${inscription.classe?.filiere || 'Non définie'}</p>
                    </div>
                    
                    <div class="p-2 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-500">Niveau</p>
                        <p class="text-sm font-medium">${inscription.classe?.niveau || 'Non défini'}</p>
                    </div>
                </div>
            </div>

            <div class="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span class="text-sm text-gray-500">
                    Année: ${inscription.annee_scolaire || '2025'}
                </span>
                <div class="flex space-x-2">
                    <button data-id="${inscription.id}" class="edit-btn px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-sm">
                        <i class="fas fa-edit mr-1"></i> Modifier
                    </button>
                    <button data-id="${inscription.id}" class="cancel-btn px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-sm">
                        <i class="fas fa-times mr-1"></i> Annuler
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrer les inscriptions par classe
function filterInscriptions(classId) {
    const fullInscriptions = prepareInscriptionsData();
    if (!classId) return fullInscriptions;
    return fullInscriptions.filter(ins => ins.id_classe === classId);
}

// Valider le formulaire
function validateForm() {
    let isValid = true;
    const requiredFields = [
        { id: 'studentNom', errorId: 'studentNomError', message: 'Le nom est obligatoire' },
        { id: 'studentPrenom', errorId: 'studentPrenomError', message: 'Le prénom est obligatoire' },
        { id: 'studentEmail', errorId: 'studentEmailError', message: 'Email invalide', 
          validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) },
        { id: 'studentClasse', errorId: 'studentClasseError', message: 'La classe est obligatoire' }
    ];

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const errorElement = document.getElementById(field.errorId);
        const value = element.value.trim();
        
        let fieldValid = true;
        
        if (field.validate) {
            fieldValid = value && field.validate(value);
        } else {
            fieldValid = !!value;
        }
        
        if (!fieldValid) {
            errorElement.textContent = field.message;
            errorElement.classList.remove('hidden');
            isValid = false;
        } else {
            errorElement.classList.add('hidden');
        }
    });

    return isValid;
}

// Gestion du modal
function openModal() {
    document.getElementById('addInscriptionModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('addInscriptionModal').classList.add('hidden');
    document.getElementById('addInscriptionForm').reset();
    document.querySelectorAll('[id$="Error"]').forEach(el => el.classList.add('hidden'));
}

// Ajouter une nouvelle inscription
function addInscription(formData) {
    // Générer les nouveaux IDs
    const newUserId = Math.max(0, ...appData.utilisateur.map(u => parseInt(u.id_utilisateur))) + 1;
    const newStudentId = Math.max(0, ...appData.etudiant.map(e => parseInt(e.id_etudiant))) + 1;
    const newInscriptionId = Math.max(0, ...appData.inscription.map(i => parseInt(i.id_inscription))) + 1;

    // Créer les nouvelles entrées
    const newUser = {
        id_utilisateur: newUserId.toString(),
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        mot_de_passe: "mdp123",
        role: "Étudiant",
        id: generateId()
    };

    const newStudent = {
        id_etudiant: newStudentId.toString(),
        id_utilisateur: newUserId.toString(),
        matricule: generateMatricule(appData.etudiant),
        adresse: formData.adresse || '',
        id: generateId()
    };

    const newInscription = {
        id_inscription: newInscriptionId.toString(),
        id_etudiant: newStudentId.toString(),
        id_classe: formData.classe,
        annee_scolaire: "2025",
        id: generateId()
    };

    // Mettre à jour les données
    appData.utilisateur.push(newUser);
    appData.etudiant.push(newStudent);
    appData.inscription.push(newInscription);

    // Sauvegarder dans le localStorage
    const saved = saveDataToLocalStorage();
    
    if (saved) {
        // Mettre à jour l'affichage
        renderInscriptions(filterInscriptions());
        return true;
    }
    return false;
}

// Initialisation de la page
async function initPage() {
    // Charger les données initiales
    await loadInitialData();
    
    // Initialiser l'affichage
    renderClasses();
    renderInscriptions(prepareInscriptionsData());
    
    // Gestion du filtre
    document.getElementById('classe-filter').addEventListener('change', (e) => {
        renderInscriptions(filterInscriptions(e.target.value));
    });
    
    // Bouton "Nouveau"
    document.getElementById('add-new-btn').addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    
    // Annulation du modal
    document.getElementById('cancelAddInscription').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });
    
    // Soumission du formulaire
    document.getElementById('addInscriptionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const formData = {
            nom: document.getElementById('studentNom').value.trim(),
            prenom: document.getElementById('studentPrenom').value.trim(),
            email: document.getElementById('studentEmail').value.trim(),
            adresse: document.getElementById('studentAdresse').value.trim(),
            classe: document.getElementById('studentClasse').value
        };

        const success = addInscription(formData);
        
        if (success) {
            closeModal();
            alert("Inscription ajoutée avec succès!");
        } else {
            alert("Erreur lors de l'ajout");
        }
    });
    
    // Boutons Modifier/Annuler
    document.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const id = e.target.closest('.edit-btn').getAttribute('data-id');
            console.log(`Modifier inscription ${id}`);
        }
        
        if (e.target.closest('.cancel-btn')) {
            e.preventDefault();
            const id = e.target.closest('.cancel-btn').getAttribute('data-id');
            if (confirm(`Voulez-vous vraiment annuler l'inscription ${id}?`)) {
                console.log(`Annuler inscription ${id}`);
            }
        }
    });
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', initPage);