document
.getElementById("googleLogin")
.addEventListener("click", ()=>{

    window.location.href =
    API_BASE + "/auth/login";

});