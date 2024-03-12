// fade in
async function fadeIn(element, display = null) {
  if (display) {
    element.css("display", display);
  } else {
    element.show();
  }
  
  element.css("opacity", 0);
  
  let opacity = 0;

  const promise = new Promise(async resolve => {
    const interval = setInterval(() => {
      opacity += 0.1;
  
      element.css("opacity", opacity);
  
      if (opacity > 0.9) {
        clearInterval(interval);
        resolve();
      }
    }, 20);
  });

  await promise;
}

// fade out
async function fadeOut(element) {
  let opacity = 1;

  const promise = new Promise(async resolve => {
    const interval = setInterval(() => {
      opacity -= 0.1;
  
      element.css("opacity", opacity);
  
      if (opacity < 0.1) {
        clearInterval(interval);
        resolve();
      }
    }, 20);
  });

  await promise;

  element.hide();
  element.css("opacity", 1);
}

// section 1 image load
function loadImgs() {
  fetch("/api/home/imgs/extensions")
    .then(response => response.json())
    .then(response => {
      let imgs = $(".section1-picture");
      
      for (let img of imgs) {
        img = $(img);
        let num = parseInt(img.attr("id").substring(16));
        img.attr("src", `/public/images/home/home${num}.${response.data[num - 1]}`);
      }
    });
}

loadImgs();

// section 1 image hover 
$(".section1-picture").click(async e => {
  await fadeOut($("#section1-logo"));
  $("#section1-logo").attr("src", $(e.target).attr("src"));
  await fadeIn($("#section1-logo"))
});

// section 2 form submit
$("#section2-inputs").submit(e => {
  e.preventDefault();
  $("#email-submit").attr("disabled", true);

  const loadingAnimation = new LoadingAnimation($("#email-submit"));
  loadingAnimation.start();

  fetch("/api/email", {
    method: "POST",
    body: JSON.stringify({ email: $("#email-input").val() }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    if (response.status === "success" || response.msg === "duplicate email") {
      $("#email-input").val(null);
    } else {
      let headerMsg = new HeaderMessage("An error occurred when attempting to submit the email.", "red", 2);

      headerMsg.display();
    }

    loadingAnimation.end();
    $("#email-submit").attr("disabled", false);
  });
});

// section 3 text
$(document).ready(() => {
  fetch("/api/home/text")
    .then(response => response.json())
    .then(response => {
      if (response.text) {
        $("#body-text").html(response.text.replaceAll("\n", "<br>"));
      } else {
        console.log(response.msg);
      }
    });
});

// section 4 text
$(document).ready(() => {
  fetch("/api/home/contact/text")
    .then(response => response.json())
    .then(response => {
      if (response.text) {
        $("#contact-body-text").html(response.text.replaceAll("\n", "<br>"));
      } else {
        console.log(response.msg);
      }
    });
});