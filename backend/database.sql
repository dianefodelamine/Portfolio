-- Création de la base de données
CREATE DATABASE IF NOT EXISTS portfolio_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio_db;

-- Table des administrateurs (utilisateurs)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    technologies VARCHAR(255) NOT NULL,
    github_link VARCHAR(255),
    live_link VARCHAR(255),
    image_url VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des messages (contact)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(150),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paramètres globaux (Clé-Valeur pour les textes des pages)
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description VARCHAR(255)
);

-- Table des questions du chatbot ("Diane")
CREATE TABLE IF NOT EXISTS chatbot_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0
);

-- Table pour la galerie d'images (Page d'accueil)
CREATE TABLE IF NOT EXISTS gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150),
    image_url VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion de données par défaut pour les paramètres (Contrôle total du CMS)
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES 
('home_title', 'Développeur Frontend Créatif', 'Titre principal de la page d\'accueil'),
('home_subtitle', 'Passionné par la création d\'interfaces web interactives et accessibles.', 'Sous-titre (slogan) de la page d\'accueil'),
('hero_image', '', 'Chemin vers la photo de profil (Accueil)'),
('about_intro', 'Je suis un développeur frontend passionné par la création d\'interfaces claires, accessibles et élégantes.', 'Introduction de la page À propos'),
('about_image', '', 'Chemin vers l\'image de la section À propos'),
('contact_email', 'contact@monportfolio.com', 'Email de contact principal'),
('contact_phone', '+33 6 12 34 56 78', 'Numéro de téléphone'),
('contact_address', 'Paris, France', 'Adresse ou localisation'),
('social_linkedin', 'https://linkedin.com/in/votreprofil', 'Lien vers LinkedIn'),
('social_github', 'https://github.com/votreprofil', 'Lien vers GitHub'),
('footer_text', '© 2026 Fode Lamine Diane. Tous droits réservés.', 'Texte du pied de page');

-- Si vous installez le site pour la première fois, créez l'administrateur via l'interface d'inscription admin.
-- Pour une installation initiale, ne pas insérer d'utilisateur administrateur par défaut ici.
