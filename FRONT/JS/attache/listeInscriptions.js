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
        const studentData = etudiant.id_etudiant ? etudiant : (etudiant.etudiant || {});
        const num = parseInt(studentData.matricule?.replace('E221-', '') || '0');
        return num > max ? num : max;
    }, 0);
    return `E221-${String(lastMatricule + 1).padStart(4, '0')}`;
}

// Fonction pour formater l'année scolaire (2025 -> 2025-2026)
function formatAnneeScolaire(year) {
    return `${year}-${parseInt(year) + 1}`;
}

// Charger les données initiales depuis le localStorage ou le fichier JSON
async function loadInitialData() {
    const savedData = localStorage.getItem('schoolManagementData');
    
    if (savedData) {
        appData = JSON.parse(savedData);
        return appData;
    }
    
    try {
        const response = await fetch('../../../BACK/data.json');
        if (!response.ok) throw new Error('Erreur de chargement');
        appData = await response.json();
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
                utilisateur: utilisateur
            },
            classe: classe,
            annee_scolaire_formatted: formatAnneeScolaire(inscription.annee_scolaire)
        };
    });
}

// Afficher les classes dans les selects
function renderClasses() {
    const filterSelect = document.getElementById('classe-filter');
    const modalSelect = document.getElementById('studentClasse');
    
    filterSelect.innerHTML = '<option value="">Toutes les classes</option>';
    modalSelect.innerHTML = '<option value="">Sélectionnez une classe</option>';
    
    appData.classe.forEach(classe => {
        const optionText = `${classe.libelle} (${classe.niveau})`;
        
        const filterOption = document.createElement('option');
        filterOption.value = classe.id_classe;
        filterOption.textContent = optionText;
        filterSelect.appendChild(filterOption);
        
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
                    Année: ${inscription.annee_scolaire_formatted || '2025-2026'}
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

// Filtrer les inscriptions par classe et année
function filterInscriptions(classId, year) {
    const fullInscriptions = prepareInscriptionsData();
    let filtered = fullInscriptions;
    
    if (classId) {
        filtered = filtered.filter(ins => ins.id_classe === classId);
    }
    
    if (year) {
        filtered = filtered.filter(ins => ins.annee_scolaire === year);
    }
    
    return filtered;
}

// Valider le formulaire
function validateForm() {
    let isValid = true;
    const requiredFields = [
        { id: 'studentNom', errorId: 'studentNomError', message: 'Le nom est obligatoire' },
        { id: 'studentPrenom', errorId: 'studentPrenomError', message: 'Le prénom est obligatoire' },
        { id: 'studentEmail', errorId: 'studentEmailError', message: 'Email invalide', 
          validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) },
          { id: 'studentAdresse', errorId: 'studentAdresseError', message: 'L\'adresse obligatoire'},
        { id: 'studentClasse', errorId: 'studentClasseError', message: 'La classe est obligatoire' },
        { id: 'studentAnnee', errorId: 'studentAnneeError', message: 'L\'année scolaire est obligatoire' }
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
async function addInscription(formData) {
    const newUserId = Math.max(0, ...appData.utilisateur.map(u => parseInt(u.id_utilisateur))) + 1;
    const newStudentId = Math.max(0, ...appData.etudiant.map(e => parseInt(e.id_etudiant))) + 1;
    const newInscriptionId = Math.max(0, ...appData.inscription.map(i => parseInt(i.id_inscription))) + 1;

    const selectedYear = document.getElementById('annee-filter').value;
    
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
        annee_scolaire: formData.annee,
        id: generateId()
    };

    appData.utilisateur.push(newUser);
    appData.etudiant.push(newStudent);
    appData.inscription.push(newInscription);

    try {
        const userResponse = await fetch('http://localhost:3000/utilisateur', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser)
        });

        if (!userResponse.ok) throw new Error('Erreur création utilisateur');

        const studentResponse = await fetch('http://localhost:3000/etudiant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newStudent)
        });

        if (!studentResponse.ok) throw new Error('Erreur création étudiant');

        const inscriptionResponse = await fetch('http://localhost:3000/inscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newInscription)
        });

        if (!inscriptionResponse.ok) throw new Error('Erreur création inscription');

        saveDataToLocalStorage();
        renderInscriptions(filterInscriptions('', selectedYear));
        return true;
    } catch (error) {
        console.error("Erreur de sauvegarde:", error);
        appData.utilisateur = appData.utilisateur.filter(u => u.id !== newUser.id);
        appData.etudiant = appData.etudiant.filter(e => e.id !== newStudent.id);
        appData.inscription = appData.inscription.filter(i => i.id !== newInscription.id);
        return false;
    }
}

// Configurer les filtres
function setupFilters() {
    const classeFilter = document.getElementById('classe-filter');
    const anneeFilter = document.getElementById('annee-filter');
    
    const applyFilters = () => {
        const selectedClass = classeFilter.value;
        const selectedYear = anneeFilter.value;
        renderInscriptions(filterInscriptions(selectedClass, selectedYear));
    };
    
    classeFilter.addEventListener('change', applyFilters);
    anneeFilter.addEventListener('change', applyFilters);
}

// Initialisation de la page
async function initPage() {
    await loadInitialData();
    renderClasses();
    
        // Définir l'année courante par défaut (2025)
        const currentYear = '2025';
        document.getElementById('annee-filter').value = currentYear;
        document.getElementById('studentAnnee').value = currentYear;
        
        // Synchroniser les changements d'année entre les filtres
        document.getElementById('annee-filter').addEventListener('change', function() {
            document.getElementById('studentAnnee').value = this.value;
        });
    
    // Afficher les inscriptions de l'année courante
    renderInscriptions(filterInscriptions('', currentYear));
    
    setupFilters();
    
    document.getElementById('add-new-btn').addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    
    document.getElementById('cancelAddInscription').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });
    
    document.getElementById('addInscriptionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const formData = {
            nom: document.getElementById('studentNom').value.trim(),
            prenom: document.getElementById('studentPrenom').value.trim(),
            email: document.getElementById('studentEmail').value.trim(),
            adresse: document.getElementById('studentAdresse').value.trim(),
            classe: document.getElementById('studentClasse').value,
            annee: document.getElementById('studentAnnee').value
        };

        const success = await addInscription(formData);
        
        if (success) {
            closeModal();
            // Recharger les inscriptions avec le filtre actuel
            const selectedClass = document.getElementById('classe-filter').value;
            const selectedYear = document.getElementById('annee-filter').value;
            renderInscriptions(filterInscriptions(selectedClass, selectedYear));
            alert("Inscription ajoutée avec succès!");
        } else {
            alert("Erreur lors de l'ajout");
        }
    });
    
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