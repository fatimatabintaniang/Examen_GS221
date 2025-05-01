document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

 
    document.getElementById('emailError').classList.add('hidden');
    document.getElementById('passwordError').classList.add('hidden');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    let isValid = true;

    // Validation email
    if (!email) {
        document.getElementById('emailError').querySelector('.error-message').textContent = "L'email est obligatoire.";
        document.getElementById('emailError').classList.remove('hidden');
        isValid = false;
    } else if (!email.includes('@')) {
        document.getElementById('emailError').querySelector('.error-message').textContent = "L'email doit contenir un @.";
        document.getElementById('emailError').classList.remove('hidden');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailError').querySelector('.error-message').textContent = "Veuillez entrer un email valide (ex: exemple@domaine.com).";
        document.getElementById('emailError').classList.remove('hidden');
        isValid = false;
    }

    if (!password) {
        document.getElementById('passwordError').querySelector('.error-message').textContent = "Le mot de passe est obligatoire.";
        document.getElementById('passwordError').classList.remove('hidden');
        isValid = false;
    }

    if (!isValid) return;

    try {
        // Recherche de l'utilisateur dans la base de données
        const response = await fetch('http://localhost:3000/utilisateur?email=' + encodeURIComponent(email) + '&mot_de_passe=' + encodeURIComponent(password));
        const users = await response.json();

        if (users.length === 0) {
            document.getElementById('emailError').querySelector('.error-message').textContent = "Email ou mot de passe incorrect.";
            document.getElementById('emailError').classList.remove('hidden');
            return;
        }

        const user = users[0];

        // Vérification si c'est un professeur archivé
        if (user.role === 'Professeur') {
            const profResponse = await fetch(`http://localhost:3000/professeur?id_utilisateur=${user.id_utilisateur}`);
            const profs = await profResponse.json();

            if (profs.length > 0 && profs[0].archive === 1) {
                document.getElementById('emailError').querySelector('.error-message').textContent = "Ce compte professeur est archivé.";
                document.getElementById('emailError').classList.remove('hidden');
                return;
            }
        }

        // Stockage de l'utilisateur dans le localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Redirection en fonction du rôle
        switch (user.role) {
            case 'RP':
                window.location.href = '../rp/dashboard.html';
                break;
            case 'Professeur':
                window.location.href = '../professeur/listeCours.html';
                break;
            case 'Attaché':
                window.location.href = '../attache/dashboardatt.html';
                break;
            case 'Étudiant':
                window.location.href = '../etudiant/listeCours.html';
                break;
            default:
                window.location.href = 'dashboard.html';
        }

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        document.getElementById('emailError').querySelector('.error-message').textContent = "Une erreur est survenue lors de la connexion.";
        document.getElementById('emailError').classList.remove('hidden');
    }



});



