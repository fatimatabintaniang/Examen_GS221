// Variables globales
let db = {
    cours: [],
    professeur: [],
    utilisateur: [],
    module: [],
    classe: [],
    cours_classe: []
};

// Fonction principale pour charger les données
async function loadData() {
    try {
        // Charger toutes les données en parallèle
        const [cours, professeurs, utilisateurs, modules, classes, coursClasses] = await Promise.all([
            fetch('http://localhost:3000/cours').then(handleResponse),
            fetch('http://localhost:3000/professeur').then(handleResponse),
            fetch('http://localhost:3000/utilisateur').then(handleResponse),
            fetch('http://localhost:3000/module').then(handleResponse),
            fetch('http://localhost:3000/classe').then(handleResponse),
            fetch('http://localhost:3000/cours_classe').then(handleResponse)
        ]);

        // Mettre à jour la base de données locale
        db = {
            cours,
            professeur: professeurs,
            utilisateur: utilisateurs,
            module: modules,
            classe: classes,
            cours_classe: coursClasses
        };

        // Ajouter les classes aux cours pour faciliter l'affichage
        db.cours.forEach(c => {
            c.classes = db.cours_classe
                .filter(cc => cc.id_cours == c.id_cours)
                .map(cc => cc.id_classe);
        });

        // Afficher les cours
        displayCourses(db.cours);

        // Charger les professeurs dans le filtre
        loadProfessors();

    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showError("Impossible de charger les données. Veuillez réessayer.");
    }
}

// Gestion des réponses API
function handleResponse(response) {
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
}

// Afficher un message d'erreur
function showError(message) {
    const container = document.getElementById('coursesContainer');
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

// Obtenir le nom d'un professeur
function getProfesseurName(id_professeur) {
    if (!id_professeur) return "Non assigné";

    const professeur = db.professeur.find(p => p.id_professeur == id_professeur);
    if (!professeur) return "Non assigné";

    const utilisateur = db.utilisateur.find(u => u.id_utilisateur == professeur.id_utilisateur);
    return utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : "Non assigné";
}

// Obtenir le nom d'un module
function getModuleName(id_module) {
    if (!id_module) return "Non assigné";

    const module = db.module.find(m => m.id_module == id_module);
    return module ? module.libelle : "Non assigné";
}

// Formater une date
function formatDate(dateString) {
    if (!dateString) return "Date non définie";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Formater l'heure
function formatTime(timeString) {
    if (!timeString) return "--:--";
    return timeString.substring(0, 5); // HH:MM
}

// Afficher les cours
function displayCourses(courses) {
    const container = document.getElementById('coursesContainer');

    if (!courses || courses.length === 0) {
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

    container.innerHTML = courses.map(cour => `
        <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg border transition-all duration-500 group transform hover:-translate-y-2 border border-gray-100">
            <!-- Bandeau coloré -->
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>

            <!-- Contenu principal -->
            <div class="p-5 pt-6">
                <!-- En-tête -->
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">
                            ${formatDate(cour.date)}
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">
                            ${cour.semestre || 'Non défini'}
                        </p>
                    </div>
                    <span class="bg-gray-100 shadow-inner rounded-lg px-2.5 py-1 text-sm font-medium text-gray-700">
                        ${formatTime(cour.heure_debut)}-${formatTime(cour.heure_fin)}
                    </span>
                </div>

                <!-- Professeur et heures -->
                <div class="mb-4 flex flex-wrap gap-2">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        ${getProfesseurName(cour.id_professeur)}
                    </span>
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${cour.nombre_heures || '0'}h
                    </span>
                </div>

                <!-- Module -->
                <div class="mb-2">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${getModuleName(cour.id_module)}
                    </span>
                </div>

              
            </div>

            <!-- Actions -->
            <div class="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                <button onclick="editCourse('${cour.id_cours}')" class="text-xs text-gray-600 hover:text-primary transition-colors">
                    ✏️ Modifier
                </button>
               <button onclick="viewClasses('${cour.id_cours}')" class="text-xs text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
    <i class="fas fa-users mr-1"></i> Voir Classes
</button>
               <button onclick="showCancelConfirmation('${cour.id_cours}')" class="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
    <i class="fas fa-trash-alt"></i> Annuler
</button>
            </div>
        </div>
    `).join('');
}

// Filtrer les cours
function filterCourses() {
    const professeurId = document.getElementById('professeur_filtre').value;
    const dateDebut = document.getElementById('date_debut').value;
    const dateFin = document.getElementById('date_fin').value;

    let filteredCourses = [...db.cours];

    if (professeurId) {
        filteredCourses = filteredCourses.filter(c => c.id_professeur == professeurId);
    }

    if (dateDebut) {
        filteredCourses = filteredCourses.filter(c => new Date(c.date) >= new Date(dateDebut));
    }

    if (dateFin) {
        filteredCourses = filteredCourses.filter(c => new Date(c.date) <= new Date(dateFin));
    }

    displayCourses(filteredCourses);
}

// Charger les professeurs dans le filtre
function loadProfessors() {
    const select = document.getElementById('professeur_filtre');
    select.innerHTML = '<option value="">-- Tous les professeurs --</option>';

    db.professeur.forEach(prof => {
        const user = db.utilisateur.find(u => u.id_utilisateur == prof.id_utilisateur);
        if (user) {
            const option = document.createElement('option');
            option.value = prof.id_professeur;
            option.textContent = `${user.prenom} ${user.nom}`;
            select.appendChild(option);
        }
    });
}

// Charger les options des professeurs dans le modal
function loadProfessorOptions(selectId = 'newCourseProfessor') {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Sélectionnez un professeur</option>';

    db.professeur.forEach(prof => {
        const user = db.utilisateur.find(u => u.id_utilisateur == prof.id_utilisateur);
        if (user) {
            const option = document.createElement('option');
            option.value = prof.id_professeur;
            option.textContent = `${user.prenom} ${user.nom}`;
            select.appendChild(option);
        }
    });
}
// Charger les options des modules dans le modal
function loadModuleOptions(selectId = 'newCourseModule') {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Sélectionnez un module</option>';

    db.module.forEach(mod => {
        const option = document.createElement('option');
        option.value = mod.id_module;
        option.textContent = mod.libelle;
        select.appendChild(option);
    });
}

// Charger les options des classes dans le modal
function loadClassOptions(containerId = 'classesCheckboxContainer') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    db.classe.forEach(classe => {
        const div = document.createElement('div');
        div.className = 'flex items-center';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `editClass-${classe.id_classe}`;
        input.name = 'classes';
        input.value = classe.id_classe;
        input.className = 'h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded';

        const label = document.createElement('label');
        label.htmlFor = `editClass-${classe.id_classe}`;
        label.className = 'ml-2 text-sm text-gray-700';
        label.textContent = classe.libelle;

        div.appendChild(input);
        div.appendChild(label);
        container.appendChild(div);
    });
}
// Ouvrir le modal d'ajout
function openAddCourseModal() {
    const modal = document.getElementById('addCourseModal');
    modal.classList.remove('hidden');

    // Charger les options
    loadProfessorOptions();
    loadModuleOptions();
    loadClassOptions();
}

// Fermer le modal
function closeAddCourseModal() {
    document.getElementById('addCourseModal').classList.add('hidden');
    document.getElementById('addCourseForm').reset();
}


function validateDate(date) {
    if (!date) return "La date est requise";
    if (new Date(date) < new Date()) return "La date ne peut pas être dans le passé";
    return "";
}

function validateTime(time) {
    if (!time) return "L'heure est requise";
    return "";
}


function validateStartEndTime(startTime, endTime) {
    if (startTime && endTime) {
        if (startTime >= endTime) return "L'heure de fin doit être après l'heure de début";
    }
    return "";
}

function validateNumber(value, min, max) {
    if (!value) return "Ce champ est requis";
    if (isNaN(value)) return "Doit être un nombre";
    if (value < min) return `Doit être au moins ${min}`;
    if (value > max) return `Doit être au plus ${max}`;
    return "";
}

function validateRequired(value) {
    if (!value) return "Ce champ est requis";
    return "";
}

function validateClasses(selectedClasses) {
    if (selectedClasses.length === 0) return "Sélectionnez au moins une classe";
    return "";
}

// Enregistrer un nouveau cours
async function saveNewCourse(event) {
    event.preventDefault();

    // Récupérer les valeurs
    const date = document.getElementById('newCourseDate').value;
    const startTime = document.getElementById('newCourseStartTime').value;
    const endTime = document.getElementById('newCourseEndTime').value;
    const hours = document.getElementById('newCourseHours').value;
    const semester = document.getElementById('newCourseSemester').value;
    const professor = document.getElementById('newCourseProfessor').value;
    const module = document.getElementById('newCourseModule').value;
    const selectedClasses = Array.from(document.querySelectorAll('input[name="classes"]:checked'))
        .map(checkbox => checkbox.value);

    // Valider les champs
    const errors = {
        date: validateDate(date),
        startTime: validateTime(startTime),
        endTime: validateTime(endTime),
        timeComparison: validateStartEndTime(startTime, endTime),
        hours: validateNumber(hours, 1, 8),
        semester: validateRequired(semester),
        professor: validateRequired(professor),
        module: validateRequired(module),
        classes: validateClasses(selectedClasses)
    };

    // Afficher les erreurs
    document.getElementById('newCourseDate-error').textContent = errors.date;
    document.getElementById('newCourseStartTime-error').textContent = errors.startTime;
    document.getElementById('newCourseEndTime-error').textContent = errors.endTime || errors.timeComparison; // Affiche l'erreur de comparaison sous endTime
    document.getElementById('newCourseHours-error').textContent = errors.hours;
    document.getElementById('newCourseSemester-error').textContent = errors.semester;
    document.getElementById('newCourseProfessor-error').textContent = errors.professor;
    document.getElementById('newCourseModule-error').textContent = errors.module;
    document.getElementById('classesCheckboxContainer-error').textContent = errors.classes;

    // Vérifier s'il y a des erreurs
    const hasErrors = Object.values(errors).some(error => error !== "");
    if (hasErrors) return;

    // Si pas d'erreurs, continuer avec l'enregistrement
    const newCourseId = db.cours.length > 0
        ? Math.max(...db.cours.map(c => parseInt(c.id_cours))) + 1
        : 1;

    const newCourse = {
        id_cours: newCourseId.toString(),
        date: date,
        heure_debut: startTime + ":00",
        heure_fin: endTime + ":00",
        nombre_heures: hours,
        semestre: semester,
        id_professeur: professor,
        id_module: module
    };

    try {
        // Enregistrer le cours
        const courseResponse = await fetch('http://localhost:3000/cours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCourse)
        });

        if (!courseResponse.ok) throw new Error('Erreur lors de la création du cours');

        // Enregistrer les relations cours_classe
        await Promise.all(selectedClasses.map(async (classId) => {
            const newCoursClasseId = db.cours_classe.length > 0
                ? Math.max(...db.cours_classe.map(cc => parseInt(cc.id))) + 1
                : 1;

            const coursClasse = {
                id: newCoursClasseId.toString(),
                id_cours: newCourseId.toString(),
                id_classe: classId
            };

            const response = await fetch('http://localhost:3000/cours_classe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(coursClasse)
            });

            if (!response.ok) throw new Error('Erreur lors de la création de la relation cours_classe');
        }));

        // Recharger les données
        await loadData();
        closeAddCourseModal();

    } catch (error) {
        console.error("Erreur:", error);
        // Au lieu d'utiliser alert, vous pourriez afficher cette erreur dans un élément dédié
        document.getElementById('formGeneralError').textContent = "Échec de l'ajout du cours: " + error.message;
    }
}

// Fonction pour ouvrir le modal de modification
function openEditCourseModal(courseId) {
    const modal = document.getElementById('editCourseModal');
    modal.classList.remove('hidden');

    // Charger les options
    loadProfessorOptions('editCourseProfessor');
    loadModuleOptions('editCourseModule');
    loadClassOptions('editClassesCheckboxContainer');

    // Remplir avec les données du cours
    const course = db.cours.find(c => c.id_cours === courseId);
    if (!course) return;

    document.getElementById('editCourseId').value = course.id_cours;
    document.getElementById('editCourseDate').value = course.date;
    document.getElementById('editCourseStartTime').value = course.heure_debut.substring(0, 5);
    document.getElementById('editCourseEndTime').value = course.heure_fin.substring(0, 5);
    document.getElementById('editCourseHours').value = course.nombre_heures;
    document.getElementById('editCourseSemester').value = course.semestre;
    document.getElementById('editCourseProfessor').value = course.id_professeur;
    document.getElementById('editCourseModule').value = course.id_module;

    // Cocher les classes associées
    if (course.classes && course.classes.length > 0) {
        course.classes.forEach(classId => {
            const checkbox = document.querySelector(`#editClassesCheckboxContainer input[value="${classId}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

// Fonction pour fermer le modal de modification
function closeEditCourseModal() {
    document.getElementById('editCourseModal').classList.add('hidden');
    document.getElementById('editCourseForm').reset();
}


// Fonction pour sauvegarder les modifications
async function saveEditedCourse(event) {
    event.preventDefault();

    // Récupérer les valeurs
    const courseId = document.getElementById('editCourseId').value;
    const date = document.getElementById('editCourseDate').value;
    const startTime = document.getElementById('editCourseStartTime').value;
    const endTime = document.getElementById('editCourseEndTime').value;
    const hours = document.getElementById('editCourseHours').value;
    const semester = document.getElementById('editCourseSemester').value;
    const professor = document.getElementById('editCourseProfessor').value;
    const module = document.getElementById('editCourseModule').value;
    const selectedClasses = Array.from(document.querySelectorAll('#editClassesCheckboxContainer input[name="classes"]:checked'))
        .map(checkbox => checkbox.value);

    // Valider les champs
    const errors = {
        date: validateDate(date),
        startTime: validateTime(startTime),
        endTime: validateTime(endTime),
        timeComparison: validateStartEndTime(startTime, endTime),
        hours: validateNumber(hours, 1, 8),
        semester: validateRequired(semester),
        professor: validateRequired(professor),
        module: validateRequired(module),
        classes: validateClasses(selectedClasses)
    };

    // Afficher les erreurs
    document.getElementById('editCourseDate-error').textContent = errors.date;
    document.getElementById('editCourseStartTime-error').textContent = errors.startTime;
    document.getElementById('editCourseEndTime-error').textContent = errors.endTime || errors.timeComparison;
    document.getElementById('editCourseHours-error').textContent = errors.hours;
    document.getElementById('editCourseSemester-error').textContent = errors.semester;
    document.getElementById('editCourseProfessor-error').textContent = errors.professor;
    document.getElementById('editCourseModule-error').textContent = errors.module;
    document.getElementById('editClassesCheckboxContainer-error').textContent = errors.classes;

    // Vérifier s'il y a des erreurs
    const hasErrors = Object.values(errors).some(error => error !== "");
    if (hasErrors) return;

    // Trouver l'ID technique du cours
    const course = db.cours.find(c => c.id_cours === courseId);
    if (!course) {
        document.getElementById('editFormGeneralError').textContent = "Cours introuvable";
        return;
    }

    // Mettre à jour le cours
    const updatedCourse = {
        date: date,
        heure_debut: startTime + ":00",
        heure_fin: endTime + ":00",
        nombre_heures: hours,
        semestre: semester,
        id_professeur: professor,
        id_module: module
    };

    try {
        // Mettre à jour le cours en utilisant l'ID technique (course.id)
        const courseResponse = await fetch(`http://localhost:3000/cours/${course.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCourse)
        });

        if (!courseResponse.ok) throw new Error('Erreur lors de la mise à jour du cours');

        // Mettre à jour les relations cours_classe
        // D'abord supprimer les anciennes relations
        const existingRelations = db.cours_classe.filter(cc => cc.id_cours === courseId);
        await Promise.all(existingRelations.map(async relation => {
            await fetch(`http://localhost:3000/cours_classe/${relation.id}`, {
                method: 'DELETE'
            });
        }));

        // Puis ajouter les nouvelles
        await Promise.all(selectedClasses.map(async (classId) => {
            const newCoursClasseId = db.cours_classe.length > 0
                ? Math.max(...db.cours_classe.map(cc => parseInt(cc.id))) + 1
                : 1;

            const coursClasse = {
                id: newCoursClasseId.toString(),
                id_cours: courseId,
                id_classe: classId
            };

            const response = await fetch('http://localhost:3000/cours_classe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(coursClasse)
            });

            if (!response.ok) throw new Error('Erreur lors de la création de la relation cours_classe');
        }));

        // Recharger les données
        await loadData();
        closeEditCourseModal();

    } catch (error) {
        console.error("Erreur:", error);
        document.getElementById('editFormGeneralError').textContent = "Échec de la modification du cours: " + error.message;
    }
}


// Ajoutez aussi des écouteurs pour la validation en temps réel si vous le souhaitez :
function setupRealTimeValidation() {
    document.getElementById('newCourseDate').addEventListener('change', function () {
        document.getElementById('newCourseDate-error').textContent = validateDate(this.value);
    });

    // Ajoutez des écouteurs similaires pour les autres champs
}

// Actions sur les cours (à implémenter)
function editCourse(courseId) {
    openEditCourseModal(courseId);
}
function viewClasses(courseId) {
    console.log(`Voir classes pour cours ${courseId}`);
    // À implémenter
}

function cancelCourse(courseId) {
    if (confirm(`Voulez-vous vraiment annuler le cours ${courseId} ?`)) {
        console.log(`Cours ${courseId} annulé`);
        // À implémenter: appel API pour suppression
    }
}

let currentCourseToCancel = null;

function showCancelConfirmation(courseId) {
  currentCourseToCancel = courseId;
  const modal = document.getElementById('cancelConfirmModal');
  modal.dataset.show = "true";
  modal.classList.remove('hidden');
  
  // Récupérer les infos du cours pour personnaliser le message
  const course = db.cours.find(c => c.id_cours === courseId);
  if (course) {
    const moduleName = getModuleName(course.id_module);
    const date = formatDate(course.date);
    document.getElementById('cancelModalMessage').innerHTML = `
      Êtes-vous sûr de vouloir annuler le cours de <strong>${moduleName}</strong> 
      prévu le <strong>${date}</strong> ? Cette action est irréversible.
    `;
  }
}

function hideCancelConfirmation() {
  const modal = document.getElementById('cancelConfirmModal');
  modal.dataset.show = "false";
  setTimeout(() => modal.classList.add('hidden'), 200);
  currentCourseToCancel = null;
}

//fonction pour confimer l'annulation d'un cours
async function confirmCancelCourse() {
  if (!currentCourseToCancel) return;
  
  const courseId = currentCourseToCancel;
  hideCancelConfirmation();
  
  try {
    // Trouver l'ID technique du cours
    const course = db.cours.find(c => c.id_cours === courseId);
    if (!course) {
      throw new Error('Cours introuvable');
    }

    // 1. Supprimer les relations cours_classe
    const relationsToDelete = db.cours_classe.filter(cc => cc.id_cours === courseId);
    await Promise.all(relationsToDelete.map(async relation => {
      const response = await fetch(`http://localhost:3000/cours_classe/${relation.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Échec de la suppression des relations');
    }));

    // 2. Supprimer le cours
    const response = await fetch(`http://localhost:3000/cours/${course.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Échec de la suppression du cours');

    // Recharger les données
    await loadData();
    showSuccessMessage('Cours annulé avec succès');
    
  } catch (error) {
    console.error("Erreur:", error);
    showError(`Échec de l'annulation: ${error.message}`);
  }
}

// Fonction pour ouvrir le modal avec les classes
function viewClasses(courseId) {
    const course = db.cours.find(c => c.id_cours === courseId);
    if (!course) return;
  
    // Mettre à jour le titre et sous-titre
    document.getElementById('viewClassesModalTitle').textContent = 
      `Classes pour ${getModuleName(course.id_module)}`;
  
    // Générer les cartes des classes
    const container = document.getElementById('classesCardsContainer');
    container.innerHTML = '';
  
    if (!course.classes || course.classes.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center">
          <div class="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <i class="fas fa-users text-gray-400 text-xl"></i>
          </div>
          <p class="text-gray-500">Aucune classe associée à ce cours</p>
        </div>
      `;
    } else {
      course.classes.forEach(classId => {
        const classe = db.classe.find(c => c.id_classe === classId);
        if (!classe) return;
  
     
  
        container.innerHTML += `
          <div class="rounded-lg  overflow-hidden shadow-sm hover:shadow-md transition-shadow ">
            <div class=" border border-gray-200 p-4 flex items-end ">
              <h4 class="text-black font-bold text-lg truncate">${classe.libelle}</h4>
            </div>
         
          </div>
        `;
      });
    }
  
    // Afficher le modal
    document.getElementById('viewClassesModal').classList.remove('hidden');
  }
  
  // Fonction pour fermer le modal de classe
  function closeViewClassesModal() {
    document.getElementById('viewClassesModal').classList.add('hidden');
  }
  
  // Gestion du clic en dehors du modal de classe
  document.getElementById('viewClassesModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeViewClassesModal();
    }
  });

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Charger les données
    loadData();

    // Écouteurs d'événements
    document.getElementById('applyFilter').addEventListener('click', filterCourses);
    document.getElementById('addCourseBtn').addEventListener('click', openAddCourseModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeAddCourseModal);
    document.getElementById('closeEditModalBtn').addEventListener('click', closeEditCourseModal);
    document.getElementById('cancelAddCourseBtn').addEventListener('click', closeAddCourseModal);
    document.getElementById('cancelEditCourseBtn').addEventListener('click', closeEditCourseModal);
    document.getElementById('addCourseForm').addEventListener('submit', saveNewCourse);
    document.getElementById('editCourseForm').addEventListener('submit', saveEditedCourse);
    setupRealTimeValidation();
    document.getElementById('cancelModalConfirmBtn').addEventListener('click', confirmCancelCourse);
    document.getElementById('cancelModalCancelBtn').addEventListener('click', hideCancelConfirmation);
    document.getElementById('cancelConfirmModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('cancelConfirmModal')) {
          hideCancelConfirmation();
        }
      });
});

