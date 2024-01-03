$(document).ready(() => {
  let loadingAnimation = new LoadingAnimation($("#loading-icon"), 10, 2, "#3094ff");
  loadingAnimation.start();

  let email = window.location.pathname.split('/');
  email = email[email.length - 1];

  fetch("/api/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ email: email }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    loadingAnimation.end();
    $("#loading-icon").remove();
    
    if (response.status === "success") {
      $("h3").text("Email successfully removed from subscription list.");
      $("h3").css("color", "#4cc2b4");
    } else if (response.msg === "invalid email") {
      $("h3").text("This email doesn't exist in the subscription list.");
      $("h3").css("color", "#404040");
    } else {
      $("h3").text("An internal server error occurred. Please contact unleashedandunplugged0@gmail.com if this issue persists.");
      $("h3").css("color", "#ef4e4e");
    }
  });
});