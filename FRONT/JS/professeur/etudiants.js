
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const classId = parseInt(params.get('id_classe'));
    console.log("Classe sélectionnée ID:", classId);

    const response = await fetch('../../../BACK/data.json');
    const data = await response.json();

    // Récupérer les étudiants de la classe via inscription
    const inscriptions = data.inscription.filter(insc => parseInt(insc.id_classe) === classId);
    const etudiants = inscriptions.map(insc => data.etudiant.find(e => parseInt(e.id_etudiant) === parseInt(insc.id_etudiant)));

    // Récupérer les informations de l'utilisateur pour chaque étudiant
    const utilisateurs = data.utilisateur;

    // Afficher les étudiants
    const container = document.getElementById('studentsContainer');
    container.innerHTML = '';
    // Remplacez la partie où vous créez les éléments li par ceci:
    etudiants.forEach(etudiant => {
        const utilisateur = utilisateurs.find(u => u.id_utilisateur === etudiant.id_utilisateur);

        const card = document.createElement('div');
        card.classList.add('bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden', 'border', 'border-gray-200');

        // Affichage des informations sous forme de carte
        card.innerHTML = `
        <div class="p-4">
            <div class="flex items-center justify-center space-x-4 mb-4">
                <div class="flex-shrink-0 bg-purple-100 rounded-full p-3 ">
                    <span class="text-purple-700 font-bold  text-lg ">${utilisateur.prenom.charAt(0)}${utilisateur.nom.charAt(0)}</span>
                </div>
               
            </div>
             <div>
                    <h3 class="text-lg font-semibold text-gray-800">${utilisateur.prenom} ${utilisateur.nom}</h3>
                </div>
            <div class="space-y-2">
                <p class="text-sm"><i class="fas fa-envelope mr-2 text-purple-500"></i>${utilisateur.email}</p>
            </div>
            <div class="mt-4 pt-2 border-t border-gray-200 flex justify-between items-center">
                <span class="text-xs text-gray-500">Étudiant</span>
                <label class="inline-flex items-center">
                    <input type="checkbox" class="form-checkbox h-5 w-5 text-purple-600 absence-checkbox" data-id="${etudiant.id_etudiant}">
                    <span class="ml-2 text-sm text-gray-600">Absent</span>
                </label>
            </div>
        </div>
    `;
        container.appendChild(card);
    });

    // Enregistrement des absences
    const saveAbsencesBtn = document.getElementById('saveAbsencesBtn');
    saveAbsencesBtn.addEventListener('click', async () => {
        const checkboxes = container.querySelectorAll('.absence-checkbox:checked');
        const absents = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id_etudiant));

        // Récupère la dernière id_absence actuelle
        const absences = await fetch('http://localhost:3000/absence');
        const absencesData = await absences.json();
        let maxId = 0;
        absencesData.forEach(abs => {
            const idAbs = parseInt(abs.id_absence);
            if (!isNaN(idAbs) && idAbs > maxId) maxId = idAbs;
        });

        for (let i = 0; i < absents.length; i++) {
            const newAbsence = {
                id_absence: (maxId + i + 1).toString(),
                date: new Date().toISOString().split('T')[0], // Date actuelle
                id_etudiant: absents[i].toString(),
                id_cours: classId.toString()  // Utilisation de l'ID de la classe pour l'absence
            };
            await fetch('http://localhost:3000/absence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAbsence)
            });
        }

        alert("Absences enregistrées avec succès !");
    });

});
