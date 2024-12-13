# IHCI-FaceRecog

HTML, CSS, JavaScript, Face API JS, Bootstrap,
Node.js with Express.js, PostgreSQL


# Notes:
Starting steps as collaborator:
 1. Make sure nakainstall namog node.js and search unsaon paggana sa npm
 2. Check if mogana ang npm thru typing this in CMD: "npm -v"
 3. Clone repository if ok na (copy the directory kung aha ninyo giclone)
 4. Go to CMD, then type: "cd [repository-directory]"
 5. Type: "npm install"
 6. Ang ".env.example" na file kay icopy then paste then irename to ".env" do the same to "db.js copy"
 7. Edit the database connection.(Port will be changed regularly for shared database, if ganahan mo moedit inyoha kay edit your local db, then kato na local connection gamita, Note:PostgreSQL,pag install mo)
  -  CREATE TABLE users (
        u_id SERIAL PRIMARY KEY,
        u_stud_id INT UNIQUE NOT NULL,
        u_address VARCHAR(255) NOT NULL,
        u_phone VARCHAR(11) NOT NULL,
        u_bdate DATE NOT NULL,
        u_gender VARCHAR(1) NOT NULL,
        u_civstatus VARCHAR(10) NOT NULL,
        u_guardian VARCHAR(255),
        u_wstatus VARCHAR(100),
        u_fname VARCHAR(50) NOT NULL,
        u_lname VARCHAR(50) NOT NULL,
        u_email VARCHAR(100) UNIQUE NOT NULL,
        u_passw VARCHAR(255) NOT NULL,
        u_face_data JSONB,
        u_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users
    ALTER COLUMN u_passw DROP NOT NULL;

 9. Run by: "npm start" either through vscode terminal or CMD with the repository directory

Make sure to:
    1. Pull before making any changes
    2. Do research
