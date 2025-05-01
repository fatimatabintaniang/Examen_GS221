document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const courseId = parseInt(params.get('id_cours'));
  
  try {
      const response = await fetch('../../../BACK/data.json');
      const data = await response.json();

      // Récupération des classes associées au cours
      const coursClasse = data.cours_classe.filter(cc => parseInt(cc.id_cours) === courseId);
      const classeIds = coursClasse.map(cc => parseInt(cc.id_classe));
      const classes = data.classe.filter(classe => classeIds.includes(parseInt(classe.id_classe)));

      const container = document.getElementById('classesContainer');
      
      if (classes.length === 0) {
          container.innerHTML = `
              <div class="col-span-full py-12 text-center">
                  <div class="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <i class="fas fa-school text-3xl text-gray-400"></i>
                  </div>
                  <h3 class="text-xl font-medium text-gray-700">Aucune classe associée</h3>
                  <p class="text-gray-500 mt-2">Ce cours n'est lié à aucune classe pour le moment</p>
              </div>
          `;
          return;
      }

      // Création des cartes pour chaque classe
      classes.forEach(classe => {
          // Récupérer les étudiants de la classe
          const inscriptions = data.inscription.filter(insc => 
              parseInt(insc.id_classe) === parseInt(classe.id_classe)
          );
          const etudiants = inscriptions.map(insc => 
              data.etudiant.find(e => parseInt(e.id_etudiant) === parseInt(insc.id_etudiant))
          );

          // Création de la carte
          const card = document.createElement('div');
          card.className = 'bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300';
          
          // Header de la carte
          const cardHeader = document.createElement('div');
          cardHeader.className = 'bg-gray-100  p-4 text-black';
          cardHeader.innerHTML = `
              <h3 class="text-xl font-bold">${classe.libelle}</h3>
              <div class="flex justify-between text-sm mt-1 ">
                  <span>${classe.filiere}</span>
                  <span>${classe.niveau}</span>
              </div>
          `;

          // Corps de la carte
          const cardBody = document.createElement('div');
          cardBody.className = 'p-4';

          // Statistiques
          const stats = document.createElement('div');
          stats.className = 'flex justify-between text-sm text-gray-600 mb-4';
        //   stats.innerHTML = `
            //   <span>${etudiants.length} étudiants</span>
            //   <span>${classeIds.length} cours</span>
        //   `;

          // Bouton d'action
          const actionBtn = document.createElement('button');
          actionBtn.className = 'w-[60%]  bg-blue-600 hover:bg-gray-500 text-white py-2 px-4  rounded-lg transition-colors flex justify-end ';
          actionBtn.innerHTML = `
              <i class="fas fa-user-graduate mr-2 py-1"></i>
              Voir les étudiants
          `;
          actionBtn.addEventListener('click', () => {
              window.location.href = `./etudiants.html?id_classe=${classe.id_classe}`;
          });

          // Assemblage de la carte
          cardBody.appendChild(stats);
          cardBody.appendChild(actionBtn);
          card.appendChild(cardHeader);
          card.appendChild(cardBody);
          container.appendChild(card);
      });

  } catch (error) {
      console.error("Erreur de chargement des données:", error);
      document.getElementById('classesContainer').innerHTML = `
          <div class="col-span-full py-12 text-center text-red-500">
              <i class="fas fa-exclamation-circle text-4xl mb-3"></i>
              <p>Erreur lors du chargement des classes</p>
          </div>
      `;
  }
});