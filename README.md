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
 6. Ang ".env.example" na file kay irename to ".env"
 7. Edit the database connection.(Port will be changed regularly for shared database, if ganahan mo moedit inyoha kay edit your local db, then kato na local connection gamita, Note:PostgreSQL,pag install mo)
  -  CREATE TABLE USERS(
     U_ID SERIAL PRIMARY KEY,
     U_FNAME VARCHAR(50) NOT NULL,
  	 U_LNAME VARCHAR(50) NOT NULL,
     U_EMAIL VARCHAR(100) UNIQUE NOT NULL,
     U_PASSW VARCHAR(255) NOT NULL,
     U_FACE_DATA JSONB,
     U_CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
 9. Run by: "npm start" either through vscode terminal or CMD with the repository directory

Make sure to:
    1. Pull before making any changes
    2. Do research
