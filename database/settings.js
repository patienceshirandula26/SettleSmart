document
.getElementById("settingsForm")
.addEventListener("submit", function(e){

e.preventDefault();

const data = {

fullname:
document.getElementById("fullname").value,

email:
document.getElementById("email").value,

phone:
document.getElementById("phone").value,

university:
document.getElementById("university").value,

currentPassword:
document.getElementById("currentPassword").value,

newPassword:
document.getElementById("newPassword").value

};

fetch("/api/settings",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(data)

})

.then(response=>response.json())

.then(data=>{

alert(data.message);

})

.catch(error=>{

console.log(error);

});

});