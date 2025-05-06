document.addEventListener('DOMContentLoaded', async () => {
    // Récupérer l'utilisateur connecté
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'Étudiant') {
        window.location.href = '../../HTML/connexion/connexion.html';
        return;
    }

    // Charger et afficher les données initiales
    const { absences } = await loadAndPrepareData(currentUser.id_utilisateur);
    displayAbsences(absences);

    // Gérer les soumissions de formulaire
    document.addEventListener('submit', async (e) => {
        if (e.target.matches('form.justify-form')) {
            e.preventDefault();
            await handleJustification(e.target, currentUser.id_utilisateur);
        }
    });
});

// Charge et prépare toutes les données nécessaires
async function loadAndPrepareData(userId) {
    try {
        // 1. Charger toutes les données en parallèle
        const endpoints = [
            'absence', 'cours', 'module', 
            'professeur', 'utilisateur', 
            'justification', 'etudiant'
        ];

        const responses = await Promise.all(
            endpoints.map(endpoint => 
                fetch(`http://localhost:3000/${endpoint}`)
                    .then(res => res.json())
                    .catch(() => [])
            )
        );

        const data = {
            absence: responses[0],
            cours: responses[1],
            module: responses[2],
            professeur: responses[3],
            utilisateur: responses[4],
            justification: responses[5],
            etudiant: responses[6]
        };

        // 2. Trouver l'étudiant correspondant
        const etudiant = data.etudiant.find(e => e.id_utilisateur == userId);
        if (!etudiant) {
            console.error("Étudiant non trouvé");
            return { absences: [] };
        }

        // 3. Préparer les absences avec tous les détails
        const absences = data.absence
            .filter(a => a.id_etudiant == etudiant.id_etudiant)
            .map(absence => {
                const cours = data.cours.find(c => c.id_cours == absence.id_cours);
                if (!cours) return null;

                const module = data.module.find(m => m.id_module == cours.id_module);
                const professeur = data.professeur.find(p => p.id_professeur == cours.id_professeur);
                const userProf = professeur ? data.utilisateur.find(u => u.id_utilisateur == professeur.id_utilisateur) : null;
                const justification = data.justification.find(j => j.id_absence == absence.id_absence);

                return {
                    id_absence: absence.id_absence,
                    date: absence.date,
                    heure_debut: cours.heure_debut,
                    heure_fin: cours.heure_fin,
                    semestre: cours.semestre,
                    module: module?.libelle || 'Module inconnu',
                    professeur: userProf ? `${userProf.prenom} ${userProf.nom}` : 'Professeur inconnu',
                    justification_etat: justification ? justification.etat.toLowerCase().replace('ée', 'é') : 'non_justifie',
                    justification_motif: justification?.motif || null,
                    justification_date: justification?.date || null
                };
            })
            .filter(Boolean);

        return { absences };
    } catch (error) {
        console.error("Erreur lors du chargement:", error);
        showAlert('Erreur de chargement des données', 'error');
        return { absences: [] };
    }
}

// Gère la soumission d'une justification
async function handleJustification(form, userId) {
    const idAbsence = form.querySelector('input[name="id_absence"]').value;
    const motif = form.querySelector('input[name="motif"]').value;

    try {
        // Vérifier si justification existe déjà
        const checkRes = await fetch(`http://localhost:3000/justification?id_absence=${idAbsence}`);
        const existing = await checkRes.json();
        
        if (existing.length > 0) {
            showAlert('Une justification existe déjà pour cette absence', 'error');
            return;
        }

        // Créer nouvelle justification
        const newJustification = {
            id_absence: idAbsence,
            date: new Date().toISOString().split('T')[0],
            motif: motif,
            etat: "en_attente"
        };

        // Envoyer au serveur
        const saveRes = await fetch('http://localhost:3000/justification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newJustification)
        });

        if (!saveRes.ok) throw new Error('Échec de la sauvegarde');

        // Recharger et afficher les nouvelles données
        const { absences } = await loadAndPrepareData(userId);
        displayAbsences(absences);
        showAlert('Justification soumise avec succès!', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors de la soumission', 'error');
    }
}

// Affiche les absences dans le DOM
function displayAbsences(absences) {
    const container = document.getElementById('absencesContainer');
    
    if (!absences || absences.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-16 text-center animate-pulse">
                <div class="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-inner">
                    <i class="fas fa-user-clock text-4xl text-gray-300"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-700">Aucune absence enregistrée</h3>
                <p class="text-gray-400 mt-2">Les absences apparaîtront ici</p>
            </div>
        `;
        return;
    }

    container.innerHTML = absences.map(absence => `
        <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-gray-100">
            <div class="absolute top-0 left-0 w-full h-2 ${getStatusColorClass(absence.justification_etat)}"></div>
            
            <div class="absolute top-3 right-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgClass(absence.justification_etat)}">
                    ${getStatusText(absence.justification_etat)}
                </span>
            </div>

            <div class="p-5 pt-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600 mb-2">
                            Absence
                        </span>
                        <h3 class="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors duration-300">
                            ${absence.date}
                        </h3>
                    </div>
                    <span class="bg-white shadow-md rounded-lg px-2.5 py-1 text-sm font-bold text-primary border border-gray-100">
                        ${absence.heure_debut}-${absence.heure_fin}
                    </span>
                </div>

                <div class="flex items-center mb-5 space-x-4">
                    <div class="flex items-center">
                        <i class="fas fa-calendar-day text-gray-400 mr-2"></i>
                        <span class="text-sm font-medium text-gray-600">
                            ${absence.semestre}
                        </span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-book text-gray-400 mr-2"></i>
                        <span class="text-sm font-medium text-gray-600">
                            ${absence.module}
                        </span>
                    </div>
                </div>

                <div class="flex items-center p-3 bg-gray-50 rounded-lg group-hover:bg-primary/5 transition-colors duration-300">
                    <div class="relative">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shadow-inner">
                            <span class="text-xl font-bold text-primary">
                                ${absence.professeur.charAt(0)}
                            </span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <h4 class="text-sm font-semibold text-gray-800">
                            ${absence.professeur}
                        </h4>
                        <p class="text-xs text-gray-500">Cours manqué</p>
                    </div>
                </div>
            </div>

            <div class="px-5 py-4 bg-gray-50 border-t border-gray-100">
                ${getFooterContent(absence)}
            </div>
        </div>
    `).join('');
}

// Fonctions utilitaires pour l'affichage
function getStatusColorClass(status) {
    const classes = {
        'accepté': 'bg-green-500',
        'refusé': 'bg-red-500',
        'en_attente': 'bg-yellow-500',
        'non_justifie': 'bg-gradient-to-r from-red-500 to-orange-500'
    };
    return classes[status] || 'bg-gray-500';
}

function getStatusBgClass(status) {
    const classes = {
        'accepté': 'bg-green-100 text-green-800',
        'refusé': 'bg-red-100 text-red-800',
        'en_attente': 'bg-yellow-100 text-yellow-800',
        'non_justifie': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status) {
    const texts = {
        'accepté': 'Justifiée',
        'refusé': 'Refusée',
        'en_attente': 'En attente',
        'non_justifie': 'Non justifiée'
    };
    return texts[status] || 'Inconnu';
}

function getFooterContent(absence) {
    if (absence.justification_etat !== 'non_justifie') {
        return `
            <div class="space-y-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgClass(absence.justification_etat)}">
                    <i class="fas ${
                        absence.justification_etat === 'accepté' ? 'fa-check-circle' :
                        absence.justification_etat === 'refusé' ? 'fa-times-circle' : 'fa-clock'
                    } mr-1"></i>
                    ${getStatusText(absence.justification_etat)}
                </span>
                <p class="text-sm text-gray-600"><strong>Motif:</strong> ${absence.justification_motif}</p>
                ${absence.justification_date ? `<p class="text-xs text-gray-500">Soumis le: ${absence.justification_date}</p>` : ''}
            </div>
        `;
    }

    return `
        <form class="justify-form w-full" data-id="${absence.id_absence}">
            <input type="hidden" name="id_absence" value="${absence.id_absence}">
            <div class="flex items-center space-x-3 w-full">
                <input type="text" name="motif" placeholder="Motif de l'absence" 
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                <button type="submit" 
                        class="px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                    Justifier
                </button>
            </div>
        </form>
    `;
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    if (!alertDiv) return;

    alertDiv.textContent = message;
    alertDiv.className = `mb-6 p-4 rounded-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' : 
        type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
    }`;
    alertDiv.classList.remove('hidden');
    
    //setTimeout : Fonction JavaScript qui exécute une action après un délai spécifié
    setTimeout(() => {
        alertDiv.classList.add('hidden');
    }, 5000);
}