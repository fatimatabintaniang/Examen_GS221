// Fonction pour formater la date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Fonction pour gérer les réponses API
function handleResponse(response) {
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
}

// Charger les données utilisateur
function loadUserData() {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            console.warn("Aucun utilisateur connecté - Redirection vers login");
            window.location.href = '../../HTML/connexion/connexion.html';
            return;
        }
        
        // Mettre à jour le nom dans le dashboard
        const welcomeName = document.getElementById('welcomeName');
        if (welcomeName) welcomeName.textContent = user.prenom || 'Utilisateur';
        
    } catch (error) {
        console.error("Erreur lors du chargement des données utilisateur:", error);
    }
}

// Mettre à jour les cours par professeur
function updateCoursesByTeacher(container, cours, professeurs, utilisateurs) {
    const coursParProfesseur = {};
    
    // Compter les cours par professeur
    cours.forEach(c => {
        coursParProfesseur[c.id_professeur] = (coursParProfesseur[c.id_professeur] || 0) + 1;
    });

    container.innerHTML = '';

    // Afficher les résultats
    for (const [profId, count] of Object.entries(coursParProfesseur)) {
        const prof = professeurs.find(p => p.id_professeur == profId);
        if (prof) {
            const user = utilisateurs.find(u => u.id_utilisateur == prof.id_utilisateur);
            if (user) {
                const percentage = Math.min(100, (count / cours.length) * 100);
                
                const div = document.createElement('div');
                div.className = 'mb-4';
                div.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">${user.prenom} ${user.nom}</span>
                        <span class="font-bold">${count} cours</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div class="bg-orange-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                `;
                container.appendChild(div);
            }
        }
    }

    if (Object.keys(coursParProfesseur).length === 0) {
        container.innerHTML = '<p class="text-gray-500">Aucun cours attribué aux professeurs</p>';
    }
}

// Mettre à jour les cours par classe
function updateCoursesByClass(container, coursClasse, classes) {
    const coursParClasse = {};
    
    // Compter les cours par classe
    coursClasse.forEach(cc => {
        coursParClasse[cc.id_classe] = (coursParClasse[cc.id_classe] || 0) + 1;
    });

    container.innerHTML = '';

    // Afficher les résultats
    for (const [classId, count] of Object.entries(coursParClasse)) {
        const classe = classes.find(c => c.id_classe == classId);
        if (classe) {
            const percentage = Math.min(100, (count / coursClasse.length) * 100);
            
            const div = document.createElement('div');
            div.className = 'mb-4';
            div.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-gray-600">${classe.libelle}</span>
                    <span class="font-bold">${count} cours</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div class="bg-amber-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            `;
            container.appendChild(div);
        }
    }

    if (Object.keys(coursParClasse).length === 0) {
        container.innerHTML = '<p class="text-gray-500">Aucun cours attribué aux classes</p>';
    }
}

// Charger les statistiques
async function loadStatistics() {
    // Vérifier les éléments conteneurs
    const teacherContainer = document.getElementById('coursesByTeacher');
    const classContainer = document.getElementById('coursesByClass');
    
    if (!teacherContainer || !classContainer) {
        console.error("Conteneurs des cours introuvables");
        return;
    }

    try {
        // Afficher un indicateur de chargement
        teacherContainer.innerHTML = '<p class="text-gray-500">Chargement...</p>';
        classContainer.innerHTML = '<p class="text-gray-500">Chargement...</p>';

        // Charger toutes les données en parallèle
        const [etudiants, classes, professeurs, cours, coursClasse, utilisateurs] = await Promise.all([
            fetch('http://localhost:3000/etudiant').then(handleResponse),
            fetch('http://localhost:3000/classe').then(handleResponse),
            fetch('http://localhost:3000/professeur').then(handleResponse),
            fetch('http://localhost:3000/cours').then(handleResponse),
            fetch('http://localhost:3000/cours_classe').then(handleResponse),
            fetch('http://localhost:3000/utilisateur').then(handleResponse)
        ]);

        console.log('Données reçues:', { cours, coursClasse, professeurs, classes });

        // Mettre à jour les compteurs principaux
        document.getElementById('totalStudents').textContent = etudiants.length;
        document.getElementById('totalClasses').textContent = classes.length;
        document.getElementById('totalTeachers').textContent = professeurs.length;

        // Mettre à jour les sections des cours
        updateCoursesByTeacher(teacherContainer, cours, professeurs, utilisateurs);
        updateCoursesByClass(classContainer, coursClasse, classes);

    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        
        // Afficher un message d'erreur
        const errorContainer = document.createElement('div');
        errorContainer.className = 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4';
        errorContainer.innerHTML = `
            <p class="font-bold">Erreur</p>
            <p>Impossible de charger les données. Veuillez réessayer.</p>
        `;
        
        const main = document.querySelector('main');
        if (main) main.prepend(errorContainer);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Afficher la date actuelle
    const dateElement = document.getElementById('current-date');
    if (dateElement) dateElement.textContent = formatDate(new Date());
    
    // Charger les données
    loadUserData();
    loadStatistics();
});