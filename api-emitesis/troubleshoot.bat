@echo off
echo --- NETSTAT --- > C:\Users\ismae\Desktop\Sistema De Prácticas Preprofesionales\sistema_practicas_preprofesionales\api-emitesis\output.log
netstat -ano | findstr :3000 >> C:\Users\ismae\Desktop\Sistema De Prácticas Preprofesionales\sistema_practicas_preprofesionales\api-emitesis\output.log 2>&1
echo --- TASKLIST --- >> C:\Users\ismae\Desktop\Sistema De Prácticas Preprofesionales\sistema_practicas_preprofesionales\api-emitesis\output.log
tasklist /FI "PID eq 10788" >> C:\Users\ismae\Desktop\Sistema De Prácticas Preprofesionales\sistema_practicas_preprofesionales\api-emitesis\output.log 2>&1
echo --- ATTEMPTING KILL --- >> C:\Users\ismae\Desktop\Sistema De Prácticas Preprofesionales\sistema_practicas_preprofesionales\api-emitesis\output.log
taskkill /PID 10788 /F >> C:\Users\ismae\Desktop\Sistema De Prácticas Preprofesionales\sistema_practicas_preprofesionales\api-emitesis\output.log 2>&1
echo --- NEW PORT CHECK --- >> C:\Users\ismae\Desktop\Sistema De Prácticas Preprofesionales\sistema_practicas_preprofesionales\api-emitesis\output.log
netstat -ano | findstr :3000 >> C:\Users\ismae\Desktop\Sistema De Prácticas Preprofesionales\sistema_practicas_preprofesionales\api-emitesis\output.log 2>&1
