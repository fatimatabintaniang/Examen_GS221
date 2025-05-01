document.addEventListener("DOMContentLoaded", () => {
    const sidebarElement = document.getElementById("sidebarEtudiant");

    if (sidebarElement) {
        fetch('../composant/sidebar/sidebarEtudiant.html')
            .then(response => response.text())
            .then(data => {
                sidebarElement.innerHTML = data;
            })
            .catch(error => {
                console.error("Erreur lors du chargement de la barre latérale:", error);
            });
    }
});


const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');

menuButton.addEventListener('click', () => {
const isHidden = sidebar.classList.contains('hidden-sidebar');
if (isHidden) {
sidebar.classList.remove('hidden-sidebar');
mainContent.classList.remove('content-full');
mainContent.classList.add('content-with-sidebar');
} else {
sidebar.classList.add('hidden-sidebar');
mainContent.classList.add('content-full');
mainContent.classList.remove('content-with-sidebar');
}
});

document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logoutBtn') {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../../HTML/connexion/connexion.html';
    }
});





