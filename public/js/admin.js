// admin password
let adminPassword;

// update admin email recipients
function updateEmailRecipients() {
  $("#admin-email-recipients").empty();
  
  let checkboxes = $(".admin-email-list-select");
  $("#admin-email-recipients").append($("<span class=\"admin-email-label\">Recipients:</span>"));

  for (let checkbox of checkboxes) {
    checkbox = $(checkbox);

    if (checkbox.is(":checked")) {
      let email = checkbox.parent().find(".admin-email-list-text").text();

      let recipient = $("<div class=\"admin-email-recipient\"></div>");
      recipient.text(email);

      $("#admin-email-recipients").append(recipient);
    }
  }
}

// admin login
$("#admin-login-form").submit(e => {
  e.preventDefault();

  const loadingAnimation = new LoadingAnimation($("#admin-password-submit"));
  loadingAnimation.start();
  $("#admin-password-submit").attr("disabled", true);

  adminPassword = $("#admin-password").val();

  fetch("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: adminPassword }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    loadingAnimation.end();
    $("#admin-password-submit").attr("disabled", false);
    
    if (response.status === "success") {
      $("#admin-login-form").hide();
      $("#admin-controls-container").show();
      $("main").css("align-items", "flex-start");

      setUpAdminPanel();
    } else {
      $("#admin-password-incorrect").show();
    }
  });
});

// create email element
function createEmailElement(text) {
  let emailElement = $("<div class=\"admin-email-list-item\"></div>").html($("#admin-email-list-template").html());
  let checkbox = emailElement.find(".admin-email-list-select");

  // copy email when clicked
  emailElement.find(".admin-email-list-text")
    .text(text)
    .click(() => {
      navigator.clipboard.writeText(text);

      let headerMsg = new HeaderMessage("Email copied to clipboard.", "green", 2);
      headerMsg.display();
    });

  emailElement.find(".admin-email-list-remove").click(e => {
    const removeButton = $(e.target);
    
    // loading animation
    const loadingAnimation = new LoadingAnimation(removeButton, 10, 2, "gray");
    loadingAnimation.start();

    // disable delete button
    removeButton.attr("disabled", true);

    // fetch request
    fetch("/api/admin/emails/remove", {
      method: "POST",
      body: JSON.stringify({ 
        password: adminPassword,
        email: text
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        // remove email from list
        emailElement.remove();
      } else {
        // error
        loadingAnimation.end();
        removeButton.attr("disabled", false);

        const headerMsg = new HeaderMessage("An error occurred when attempting to remove the email.", "red", 2);
        headerMsg.display();
      }
    });
  });

  emailElement.find(".admin-email-list-select").click(updateEmailRecipients);

  return emailElement;
}

function setUpAdminPanel() {
  const loadingAnimation = new LoadingAnimation($("#admin-email-list-loading-icon"), 20, 2, "#3094ff");
  loadingAnimation.start();
  
  // get email list
  fetch("/api/admin/emails/list", {
    method: "POST",
    body: JSON.stringify({ password: adminPassword }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    loadingAnimation.end();
    $("#admin-email-list-loading-container").hide();
    
    if (response.status === "success") {
      let emails = response.emails;

      for (let i = emails.length - 1; i >= 0; i--) {
        let emailElement = createEmailElement(emails[i]);
        
        $("#admin-email-list-emails").append(emailElement);
      }
    }
  });
}

// add email
$("#add-email-form").submit(e => {
  e.preventDefault();
  $("#add-email-submit").attr("disabled", true);

  const loadingAnimation = new LoadingAnimation($("#add-email-submit"), 15);
  loadingAnimation.start();

  fetch("/api/email", {
    method: "POST",
    body: JSON.stringify({ email: $("#add-email-input").val() }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    loadingAnimation.end();
    $("#add-email-submit").attr("disabled", false);
    
    if (response.status === "success") {
      // create email element
      let emailElement = createEmailElement($("#add-email-input").val().toLowerCase());

      $("#admin-email-list-emails").prepend(emailElement);

      // clear input value
      $("#add-email-input").val(null);
    } else {
      let headerMsg;

      if (response.msg === "duplicate email") {
        headerMsg = new HeaderMessage("This email is already recorded.", "red", 2);
        $("#add-email-input").val(null);
      } else {
        headerMsg = new HeaderMessage("An error occurred when attempting to add the email.", "red", 2);
      }

      headerMsg.display();
    }
  });
});

// select all
$("#admin-email-select-all").click(() => {
  if ($("#admin-email-select-all").is(":checked")) {
    $(".admin-email-list-select").prop("checked", true);
  } else {
    $(".admin-email-list-select").prop("checked", false);
  }

  updateEmailRecipients();
});

// send email
function sendEmail(recipient) {
  // loading animation
  const loadingAnimation = new LoadingAnimation($("#admin-email-send"));
  loadingAnimation.start();

  // disable send button
  $("#admin-email-send").attr("disabled", true);

  // prepare email
  let emailHTML = $("<div></div>");
  emailHTML.load("/public/components/email.html", () => {
    emailHTML.find("#email-body").html($("#admin-email-body").val().replaceAll("\n", "<br>"));
    emailHTML.find("#email-subject").text($("#admin-email-subject").val());
    emailHTML.find("#unsubscribe").attr("href", `https://unleashedandunplugged.illusion705.repl.co/unsubscribe/${recipient}`);

    fetch("/api/admin/email/send", {
      method: "POST",
      body: JSON.stringify({
        password: adminPassword,
        recipients: [recipient],
        subject: $("#admin-email-subject").val(),
        body: emailHTML.html()
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response => {
      let headerMsg;
      
      if (response.status === "success") {
        headerMsg = new HeaderMessage("Email successfully sent.", "green", 2);
        $("#admin-email-subject").val(null);
        $("#admin-email-body").val(null);
        $("#admin-email-recipients").html("<span class=\"admin-email-label\">Recipients:</span>");
        $(".admin-email-list-select").attr("checked", false);
      } else {
        headerMsg = new HeaderMessage("An error occurred when sending the email.", "red", 2);
      }

      loadingAnimation.end();
      $("#admin-email-send").attr("disabled", false);
      $("#admin-email-preview-container1").hide();

      headerMsg.display();
    });
  });
}

// show email preview click handler
$("#admin-email-editor").submit(e => {
  e.preventDefault();
  
  $("#admin-email-preview-container1").css("display", "flex");

  const iframeDoc = $(document.getElementById("admin-email-preview").contentDocument);
  iframeDoc.find("#email-subject").html($("#admin-email-subject").val());
  iframeDoc.find("#email-body").html($("#admin-email-body").val().replaceAll("\n", "<br>"));

  iframeDoc.find("#unsubscribe").click(() => {
    let headerMessage = new HeaderMessage("The unsubscribe button cannot be tested during email preview.", "red", 2);
    headerMessage.display();
  });
});

// send email button click handler
$("#admin-email-send").click(() => {
  // generate recipients
  let recipients = [];
  let checkboxes = $(".admin-email-list-select");
  for (let checkbox of checkboxes) {
    checkbox = $(checkbox);

    if (checkbox.is(":checked")) {
      let email = checkbox.parent().find(".admin-email-list-text").text();
      recipients.push(email);
    }
  }

  for (recipient of recipients) {
    sendEmail(recipient);
  }
});

// hide email preview
$("#admin-email-preview-hide").click(() => {
  $("#admin-email-preview-container1").hide();
});

// home page text
let homePageText;

fetch("/api/home/text")
  .then(response => response.json())
  .then(response => {
    if (response.text) {
      homePageText = response.text;
      $("#admin-home-text").val(homePageText);
      $("#admin-home-text").attr("disabled", false);
    }
  });

let homePageContactText;

fetch("/api/home/contact/text")
  .then(response => response.json())
  .then(response => {
    if (response.text) {
      homePageContactText = response.text;
      $("#admin-home-contact-text").val(homePageContactText);
      $("#admin-home-contact-text").attr("disabled", false);
    }
  });

// home page text save
$("#admin-home-text-save").click(() => {
  const loadingAnimation = new LoadingAnimation($("#admin-home-text-save"));
  loadingAnimation.start();

  $("#admin-home-text-save").attr("disabled", true);
  $("#admin-home-text").attr("disabled", true);

  fetch("/api/home/text", {
    method: "POST",
    body: JSON.stringify({
      password: adminPassword,
      text: $("#admin-home-text").val()
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    let headerMsg;
      
    if (response.status === "success") {
      headerMsg = new HeaderMessage("Home page text updated successfully.", "green", 2);
    } else {
      headerMsg = new HeaderMessage("An error occurred when updating the home page text.", "red", 2);
    }

    loadingAnimation.end();
    $("#admin-home-text-save").attr("disabled", false);
    $("#admin-home-text").attr("disabled", false);

    headerMsg.display();
  });
});

$("#admin-home-contact-text-save").click(() => {
  const loadingAnimation = new LoadingAnimation($("#admin-home-contact-text-save"));
  loadingAnimation.start();

  $("#admin-home-contact-text-save").attr("disabled", true);
  $("#admin-home-contact-text").attr("disabled", true);

  fetch("/api/home/contact/text", {
    method: "POST",
    body: JSON.stringify({
      password: adminPassword,
      text: $("#admin-home-contact-text").val()
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    let headerMsg;

    if (response.status === "success") {
      headerMsg = new HeaderMessage("Home page contact info text updated successfully.", "green", 2);
    } else {
      headerMsg = new HeaderMessage("An error occurred when updating the home page contact info text.", "red", 2);
    }

    loadingAnimation.end();
    $("#admin-home-contact-text-save").attr("disabled", false);
    $("#admin-home-contact-text").attr("disabled", false);

    headerMsg.display();
  });
});

// home page text reset
$("#admin-home-text-reset").click(() => {
  $("#admin-home-text").val(homePageText);
});

$("#admin-home-contact-text-reset").click(() => {
  $("#admin-home-contact-text").val(homePageContactText);
});

// refresh home images
function refreshHomeImages() {
  fetch("/api/home/imgs/extensions")
    .then(response => response.json())
    .then(response => {
      let imgs = $(".admin-home-img");
      
      for (let img of imgs) {
        img = $(img);
        let num = parseInt(img.attr("id").substring(14));
        img.attr("src", `/public/images/home/home${num}.${response.data[num - 1]}` + `?${new Date().getTime()}`);
      }
    });
}

refreshHomeImages();

// home page image change
$(".admin-home-img-upload").change(e => {
  if (e.target.files && e.target.files[0]) {
    let element = $(e.target);
    let num = element.attr("id").substring(21);
    $("#admin-home-img" + num).attr("src", URL.createObjectURL(e.target.files[0]));
  }
});

// home page image reset
$("#admin-home-imgs-reset").click(refreshHomeImages);

// home page images save
$("#admin-home-imgs-save").click(() => {
  const loadingAnimation = new LoadingAnimation($("#admin-home-imgs-save"));
  loadingAnimation.start();

  $("#admin-home-img-upload").attr("disabled", true);

  let promises = [];

  for (let i = 0; i < 7; i++) {
    if ($(".admin-home-img-upload")[i].files[0]) {
      let data = new FormData();
      data.append("password", adminPassword);
      data.append("imgNum", i + 1);
      data.append("file", $(".admin-home-img-upload")[i].files[0]);

      const fetchRequest = fetch("/api/home/imgs", {
        method: "POST",
        body: data
      });

      promises.push(fetchRequest);
    }
  }

  Promise.all(promises)
    .then(responses => {
      return Promise.all(responses.map(res => res.json()));
    })
    .then(responses => {
      let successes = 0;

      for (let response of responses) {
        if (response.status === "success") {
          successes++;
        }
      }

      let headerMsg;

      if (successes === responses.length) {
        headerMsg = new HeaderMessage("Home page images updated successfully.", "green", 2);
      } else {
        headerMsg = new HeaderMessage("An error occurred when updating the home page images.", "red", 2);
      }

      headerMsg.display();

      loadingAnimation.end();
      $("#admin-home-img-upload").attr("disabled", false);
    });
});

// gallery page img upload
let galleryImgs = [];

$("#admin-gallery-new-entry-img-upload").unbind("change");

$("#admin-gallery-new-entry-img-upload").change(e => {
  if (e.target.files && e.target.files[0]) {
    // clear initial message
    $("#admin-gallery-new-entry-imgs1 > h1").hide();
    $("#admin-gallery-new-entry-imgs2").css("display", "flex");

    // add imgs
    for (let file of e.target.files) {
      galleryImgs.push(file);

      let containerElement = $("<div class=\"admin-gallery-new-entry-img-container\"></div>");
      containerElement.html($("#admin-gallery-new-entry-img-template").html());
      containerElement
        .find(".admin-gallery-new-entry-img")
        .attr("src", URL.createObjectURL(file));

      containerElement
        .find(".admin-gallery-new-entry-img-delete")
        .attr("id", "admin-gallery-new-entry-img-delete" + (galleryImgs.length - 1));

      $("#admin-gallery-new-entry-imgs2").append(containerElement);
    }

    $("#admin-gallery-new-entry-imgs2").width(320 * galleryImgs.length + 20);
    $("#admin-gallery-new-entry-img-upload").val(null);
  }

  updateGalleryDeleteBtns();
});

// gallery page new entry delete image
function updateGalleryDeleteBtns() {  
  $(".admin-gallery-new-entry-img-delete").click(e => {
    let element = $(e.target);
    let id = parseInt(element.attr("id").substring(34));
  
    galleryImgs.splice(id, 1);
  
    element.parent().parent().remove();

    if (galleryImgs.length === 0) {
      $("#admin-gallery-new-entry-imgs2").css("display", "none");
      $("#admin-gallery-new-entry-imgs1 > h1").show();
    }

    $("#admin-gallery-new-entry-img-upload").attr("disabled", true);

    setTimeout(() => {
      $("#admin-gallery-new-entry-img-upload").attr("disabled", false);
    }, 250);
  });
}

// gallery page new entry reset
$("#admin-gallery-new-entry-reset").click(() => {
  $("#admin-gallery-new-entry-title").val(null);
  $("#admin-gallery-new-entry-imgs2").html(null);
  $("#admin-gallery-new-entry-imgs2").css("display", "none");
  $("#admin-gallery-new-entry-imgs1 > h1").show();
  galleryImgs = [];
});

// gallery page new entry save
$("#admin-gallery-new-entry").submit(e => {
  e.preventDefault();

  const loadingAnimation = new LoadingAnimation($("#admin-gallery-new-entry-submit"));
  loadingAnimation.start();
  $("#admin-gallery-new-entry-submit").attr("disabled", true);

  // create new entry
  fetch("/api/gallery/entry/new", {
    method: "POST",
    body: JSON.stringify({
      password: adminPassword,
      name: $("#admin-gallery-new-entry-title").val()
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    if (response.status === "success") {
      // upload imgs
      let promises = [];
      
      for (let galleryImg of galleryImgs) {
        let data = new FormData();
        data.append("password", adminPassword);
        data.append("id", response.data.id);
        data.append("file", galleryImg);
        
        let fetchRequest = fetch("/api/gallery/image/upload", {
          method: "POST",
          body: data
        });

        promises.push(fetchRequest);
      }

      Promise.all(promises)
        .then(responses => {
          return Promise.all(responses.map(res => res.json()));
        })
        .then(responses => {
          let successes = 0;
    
          for (let response of responses) {
            if (response.status === "success") {
              successes++;
            }
          }
    
          let headerMsg;
    
          if (successes === responses.length) {
            headerMsg = new HeaderMessage("Gallery entry saved successfully.", "green", 2);

            // add entry to entries list
            fetch("/api/gallery/data")
              .then(response2 => response2.json())
              .then(data => {
                createGalleryEntry(data.filter(datum => datum.id === response.data.id)[0], true);
              });

            // clear form
            $("#admin-gallery-new-entry-title").val(null);
            $("#admin-gallery-new-entry-imgs2").html(null);
            $("#admin-gallery-new-entry-imgs2").css("display", "none");
            $("#admin-gallery-new-entry-imgs1 > h1").show();
            galleryImgs = [];
          } else {
            headerMsg = new HeaderMessage("An error occurred while saving new gallery entry.", "red", 2);
          }
    
          headerMsg.display();
    
          loadingAnimation.end();
          $("#admin-gallery-new-entry-submit").attr("disabled", false);
        });
    } else {
      let headerMsg = new HeaderMessage("An error occurred while saving new gallery entry.", "red", 2);
      headerMsg.display();
      loadingAnimation.end();
      $("#admin-gallery-new-entry-submit").attr("disabled", false);
    }
  });
});

// gallery page load entries
function createGalleryEntryImg(element, deletedLog, addedLog, img, file) {
  let imgElement = $("<div class=\"admin-gallery-entry-img-container\"></div>");
  imgElement.html($("#admin-gallery-entry-img-template").html());

  // set src
  if (img) {
    imgElement
      .find(".admin-gallery-entry-img")
      .attr("src", "/public/images/gallery/" + img);
  } else if (file) {
    imgElement
      .find(".admin-gallery-entry-img")
      .attr("src", URL.createObjectURL(file));
  }

  // delete img functionality
  imgElement
    .find(".admin-gallery-entry-img-delete")
    .click(() => {
      imgElement.remove();

      if (deletedLog) {
        deletedLog.push(img);
      }

      if (addedLog) {
        addedLog.splice(addedLog.indexOf(file), 1);
      }
    });

  // append img element
  element
    .find(".admin-gallery-entry-images2")
    .append(imgElement);
}

function createGalleryEntry(data, first = false) {
  let element = $("<div class=\"admin-gallery-entry-container\"></div>");
  element.html($("#admin-gallery-entry-template").html());

  // update log
  let deleted = [];
  let added = [];

  // load name
  let nameElement = element.find(".admin-gallery-entry-name")
  nameElement.val(data.name);

  // edit name functionality
  let nameEditElement = element.find(".admin-gallery-entry-name-edit");
  
  nameEditElement.click(() => {
    if (nameElement.attr("disabled")) {
      nameElement.attr("disabled", false);
      nameEditElement.text("Finish Edit");
    } else {
      nameElement.attr("disabled", true);
      nameEditElement.text("Edit Name");
    }
  });

  // add img functionality
  const imgUploadElement = element.find(".admin-gallery-entry-img-upload");
  
  element
    .find(".admin-gallery-entry-add-img")
    .click(() => {
      imgUploadElement.trigger("click");
    });

  
  imgUploadElement.change(e => {
    if (e.target.files && e.target.files[0]) {
      for (let file of e.target.files) {
        added.push(file);
        createGalleryEntryImg(element, null, added, null, file);
        imgUploadElement.val(null);
      }
    }
  });

  // reset functionality
  const resetGalleryEntry = element.find(".admin-gallery-entry-reset");

  resetGalleryEntry.click(() => {
    const loadingAnimation = new LoadingAnimation(resetGalleryEntry);
    loadingAnimation.start();

    deleted = [];
    added = [];

    fetch("/api/gallery/data")
      .then(response => response.json())
      .then(galleryEntryData => {
        galleryEntryData = galleryEntryData.filter(datum => datum.id === data.id)[0];
        
        nameElement.val(galleryEntryData.name);

        const imagesContainer = element.find(".admin-gallery-entry-images2");
        imagesContainer.empty();

        for (let img of galleryEntryData.images) {
          createGalleryEntryImg(element, deleted, null, img, null);
        }

        loadingAnimation.end();
      });
  });

  // delete entry functionality
  let entryDeleteBtn = element.find(".admin-gallery-entry-delete");
  
  entryDeleteBtn.click(() => {
    function deleteReset() {
      if (entryDeleteBtn.text() === "Confirm") {
        entryDeleteBtn.text("Delete");
      }

      $(document).unbind("click", deleteReset);
    }
    
    if (entryDeleteBtn.text() === "Confirm") {
      // delete gallery entry
      const loadingAnimation = new LoadingAnimation(entryDeleteBtn);
      loadingAnimation.start();

      fetch("/api/gallery/entry/delete", {
        method: "POST",
        body: JSON.stringify({
          password: adminPassword,
          id: data.id
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(response => {
        let headerMsg;

        if (response.status === "success") {
          headerMsg = new HeaderMessage("Gallery entry deleted successfully.", "green", 2);

          element.remove();
        } else {
          headerMsg = new HeaderMessage("An error occurred while deleting the gallery entry.", "red", 2);
        }

        headerMsg.display();
      });
    } else {
      entryDeleteBtn.text("Confirm");

      setTimeout(() => {
        $(document).click(deleteReset);
      }, 250);
    }
  });

  // save entry functionality
  const saveGalleryEntry = element.find(".admin-gallery-entry-save");

  saveGalleryEntry.click(() => {
    const loadingAnimation = new LoadingAnimation(saveGalleryEntry);
    loadingAnimation.start();
    saveGalleryEntry.attr("disabled", true);
    
    // edit name
    fetch("/api/gallery/entry/name", {
      method: "POST",
      body: JSON.stringify({
        password: adminPassword,
        id: data.id,
        name: nameElement.val()
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        let promises1 = [];

        for (let deletedFile of deleted) {
          let request = fetch("/api/gallery/image/delete", {
            method: "POST",
            body: JSON.stringify({
              password: adminPassword,
              id: data.id,
              imgName: deletedFile
            }),
            headers: {
              "Content-Type": "application/json"
            }
          });

          promises1.push(request);
        }

        Promise.all(promises1)
          .then(responses => {
            return Promise.all(responses.map(res => res.json()));
          })
          .then(responses => {
            let successes = 0;
      
            for (let response of responses) {
              if (response.status === "success") {
                successes++;
              }
            }
      
            if (successes === responses.length) {
              let promises2 = []

              for (let addedFile of added) {
                let formData = new FormData();
                formData.append("password", adminPassword);
                formData.append("id", data.id);
                formData.append("file", addedFile);

                let request = fetch("/api/gallery/image/upload", {
                  method: "POST",
                  body: formData
                });

                promises2.push(request)
              }

              Promise.all(promises2)
                .then(responses => {
                  return Promise.all(responses.map(res => res.json()));
                })
                .then(responses => {
                  let successes = 0;
            
                  for (let response of responses) {
                    if (response.status === "success") {
                      successes++;
                    }
                  }
            
                  if (successes === responses.length) {
                    let headerMsg = new HeaderMessage("Gallery entry updated successfully.", "green", 2);
                    headerMsg.display()
                    loadingAnimation.end();
                    saveGalleryEntry.attr("disabled", false);
                  } else {
                    let headerMsg = new HeaderMessage("An error occurred while updating the gallery entry.", "red", 2);
                    headerMsg.display()
                    loadingAnimation.end();
                    saveGalleryEntry.attr("disabled", false);
                  }
                });
            } else {
              let headerMsg = new HeaderMessage("An error occurred while updating the gallery entry.", "red", 2);
              headerMsg.display()
              loadingAnimation.end();
              saveGalleryEntry.attr("disabled", false);
            }
          });
      } else {
        let headerMsg = new HeaderMessage("An error occurred while updating the gallery entry.", "red", 2);
        headerMsg.display()
        loadingAnimation.end();
        saveGalleryEntry.attr("disabled", false);
      }
    });
  });

  // load imgs
  for (let img of data.images) {
    createGalleryEntryImg(element, deleted, null, img, null);
  }

  if (first) {
    $("#admin-gallery-entries").prepend(element);
  } else {
    $("#admin-gallery-entries").append(element);
  }
}

fetch("/api/gallery/data")
  .then(response => response.json())
  .then(data => {
    for (let i = data.length - 1; i >= 0; i--) {
      createGalleryEntry(data[i]);
    }
  });

// set text and images of general pages
let generalPages = ["houseRules", "artists"];
let generalPagesText = {};
let generalPagesExtensions;

function setGeneralPagesImages() {
  $("#admin-house-rules-img").attr("src", "/public/images/houseRules/houseRules." + generalPagesExtensions.houseRules);
  $("#admin-artists-img").attr("src", "/public/images/artists/artists." + generalPagesExtensions.artists);
}

fetch("/api/general-page/extensions")
  .then(response => response.json())
  .then(data => {
    generalPagesExtensions = data.data;
    setGeneralPagesImages();
  });

for (let page of generalPages) {
  fetch(`/api/general-page/${page}/text`)
    .then(response => response.json())
    .then(data => {
      if (page === "houseRules") {
        generalPagesText.houseRules = data.data.replaceAll("<br>", "\n");
        $("#admin-house-rules-text").val(generalPagesText.houseRules);
      } else if (page === "artists") {
        generalPagesText.artists = data.data.replaceAll("<br>", "\n");
        $("#admin-artists-text").val(generalPagesText.artists);
      }
    });
}

// reset text of general page
$(".admin-general-page-text-reset").click(e => {
  switch ($(e.target).data("page")) {
    case "houseRules":
      $("#admin-house-rules-text").val(generalPagesText.houseRules);
      break;
    case "artists":
      $("#admin-artists-text").val(generalPagesText.artists);
      break;
  }
});

// save text of general page
$(".admin-general-page-text-save").click(e => {
  generalPagesText.houseRules = $("#admin-house-rules-text").val();
  generalPagesText.artists = $("#admin-artists-text").val();
  
  let page = $(e.target).data("page");
  let text = generalPagesText[page];
  let loadingAnimation = new LoadingAnimation($(e.target));
  loadingAnimation.start();
  $(e.target).attr("disabled", true);

  fetch("/api/general-page/text", {
    method: "POST",
    body: JSON.stringify({
      password: adminPassword,
      page: page,
      text: text.replaceAll("\n", "<br>")
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    if (response.status === "success") {
      let headerMsg = new HeaderMessage("Page text updated successfully.", "green", 2);
      headerMsg.display()
      loadingAnimation.end();
      $(e.target).attr("disabled", false);
    } else {
      let headerMsg = new HeaderMessage("An error occurred while updating the page text.", "red", 2);
      headerMsg.display()
      loadingAnimation.end();
      $(e.target).attr("disabled", false);
    }
  })
});

// reset image of general page
$(".admin-general-page-img-reset").click(e => {
  switch ($(e.target).data("page")) {
    case "houseRules":
      $("#admin-house-rules-img").attr("src", "/public/images/houseRules/houseRules." + generalPagesExtensions.houseRules + `?${new Date().getTime()}`);
      break;
    case "artists":
      $("#admin-artists-img").attr("src", "/public/images/artists/artists." + generalPagesExtensions.artists + `?${new Date().getTime()}`);
      break;
  }
});

// upload image of general page
$(".admin-general-page-img-upload").change(e => {
  if (e.target.files && e.target.files[0]) {
    let page = $(e.target).data("page");
    let imgElement;
  
    switch (page) {
      case "houseRules":
        imgElement = $("#admin-house-rules-img");
        break;
      case "artists":
        imgElement = $("#admin-artists-img");
        break;
    }
    
    imgElement.attr("src", URL.createObjectURL(e.target.files[0]));
  }
});

// save image of general page
$(".admin-general-page-img-save").click(e => {
  let page = $(e.target).data("page");
  
  let loadingAnimation = new LoadingAnimation($(e.target));
  loadingAnimation.start();
  $(e.target).attr("disabled", true);

  let data = new FormData();
  data.append("password", adminPassword);
  data.append("page", page);

  switch (page) {
    case "houseRules":
      data.append("file", $("#admin-house-rules-img-upload").prop("files")[0]);
      break;
    case "artists":
      data.append("file", $("#admin-artists-img-upload").prop("files")[0]);
      break;
  }

  fetch("/api/general-page/img", {
    method: "POST",
    body: data
  })
  .then(response => response.json())
  .then(response => {
    if (response.status === "success") {
      let headerMsg = new HeaderMessage("Page image updated successfully.", "green", 2);
      headerMsg.display();
      loadingAnimation.end();
      $(e.target).attr("disabled", false);
    } else {
      let headerMsg = new HeaderMessage("An error occurred while updating the page image.", "red", 2);
      headerMsg.display();
      loadingAnimation.end();
      $(e.target).attr("disabled", false);
    }
  });
});

// add image to new concert entry
$("#admin-shows-new-entry-img-upload").change(e => {
  if (e.target.files && e.target.files[0]) {
    $("#admin-shows-new-entry-img").attr("src", URL.createObjectURL(e.target.files[0]));
    $("#admin-shows-new-entry-img").show();
    $("#admin-shows-new-entry-img-placeholder").hide();
  }
});

// reset new show entry
function resetNewShowEntry() {
  $("#admin-shows-new-entry-img")
    .attr("src", null)
    .hide();

  $("#admin-shows-new-entry-img-placeholder").show();

  $("#admin-shows-new-entry-name").val(null);
  $("#admin-shows-new-entry-date").val(null);
  $("#admin-shows-new-entry-time").val(null);
  $("#admin-shows-new-entry-description").val(null);
}

$("#admin-shows-new-entry-reset").click(resetNewShowEntry);

// submit new show entry
$("#admin-shows-new-entry").submit(e => {
  e.preventDefault();

  const loadingAnimation = new LoadingAnimation($("#admin-shows-new-entry-submit"));
  loadingAnimation.start();
  $("#admin-shows-new-entry-submit").attr("disabled", true);
  $("#admin-shows-new-entry-reset").attr("disabled", true);

  let data = new FormData();
  data.append("password", adminPassword);
  data.append("name", $("#admin-shows-new-entry-name").val());
  data.append("date", $("#admin-shows-new-entry-date").val());
  data.append("time", $("#admin-shows-new-entry-time").val());
  data.append("description", $("#admin-shows-new-entry-description").val());
  data.append("file", $("#admin-shows-new-entry-img-upload")[0].files[0]);

  fetch("/api/shows/new", {
    method: "POST",
    body: data
  })
  .then(response => response.json())
  .then(response => {
    loadingAnimation.end();
    $("#admin-shows-new-entry-submit").attr("disabled", false);
    $("#admin-shows-new-entry-reset").attr("disabled", false);

    if (response.status === "success") {
      const headerMsg = new HeaderMessage("Show entry uploaded successfully.", "green", 2);
      headerMsg.display();
      resetNewShowEntry();
      createShowEntry(response.data.showData);
    } else {
      const headerMsg = new HeaderMessage("An error occurred when uploading the new show entry.", "red", 2);
      headerMsg.display();
    }
  });
});

// get current show entries
function createShowEntry(datum) {
  let div = $("<div class='admin-shows-entry'></div>");
  div.html($("#admin-shows-entry-template").html());

  let nameElement = div.find(".admin-shows-entry-name");
  let dateElement = div.find(".admin-shows-entry-date");
  let timeElement = div.find(".admin-shows-entry-time");
  let descriptionElement = div.find(".admin-shows-entry-description");
  let imgElement = div.find(".admin-shows-entry-img");
  let imgUploadElement = div.find(".admin-shows-entry-img-upload");

  function setInfo() {
    nameElement.val(datum.name);
    dateElement.val(datum.date);
    timeElement.val(datum.time);
    descriptionElement.val(datum.description);
    imgElement.attr("src", "/public/images/shows/" + datum.img);
  }
  setInfo();

  div.find(".admin-shows-entry-img-upload-label").attr("for", "admin-shows-entry-img-upload" + datum.id);

  div.find(".admin-shows-entry-img-upload")
    .attr("id", "admin-shows-entry-img-upload" + datum.id)
    .on("change", e => {
      imgElement.attr("src", URL.createObjectURL(e.target.files[0]));
    });

  div.find(".admin-shows-entry-reset").click(setInfo);

  div.find(".admin-shows-entry-save").click(e => {
    const loadingAnimation = new LoadingAnimation($(e.target));
    loadingAnimation.start();

    fetch("/api/shows/update-info", {
      method: "POST",
      body: JSON.stringify({
        password: adminPassword,
        id: datum.id,
        name: nameElement.val(),
        date: dateElement.val(),
        time: timeElement.val(),
        description: descriptionElement.val()
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response1 => {
      if (response1.status === "success") {
        datum.name = nameElement.val();
        datum.date = dateElement.val();
        datum.time = timeElement.val();
        datum.description = descriptionElement.val();

        if (imgUploadElement.get(0).files.length > 0) {
          let formData = new FormData();
          formData.append("password", adminPassword);
          formData.append("id", datum.id);
          formData.append("file", imgUploadElement.get(0).files[0]);

          fetch("/api/shows/update-img", {
            method: "post",
            body: formData,
          })
          .then(response => response.json())
          .then(response2 => {
            if (response2.status === "success") {
              datum.img = response2.data.imgName;

              const headerMsg = new HeaderMessage("Show entry updated successfully.", "green", 2);
              headerMsg.display();
            } else {
              const headerMsg = new HeaderMessage("An error occurred when updating the show entry.", "red", 2);
              headerMsg.display();
            }

            loadingAnimation.end();
          });
        } else {
          const headerMsg = new HeaderMessage("Show entry updated successfully.", "green", 2);
          headerMsg.display();

          loadingAnimation.end();
        }
      } else {
        const headerMsg = new HeaderMessage("An error occurred when updating the show entry.", "red", 2);
        headerMsg.display();

        loadingAnimation.end();
      }
    });
  });

  div.find(".admin-shows-entry-delete").click(e => {
    let element = $(e.target);

    if (element.text() === "Confirm") {
      const loadingAnimation = new LoadingAnimation(element);
      loadingAnimation.start();

      fetch("/api/shows/delete", {
        method: "POST",
        body: JSON.stringify({
          password: adminPassword,
          id: datum.id
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(response => {
        if (response.status === "success") {
          const headerMsg = new HeaderMessage("Show entry deleted successfully.", "green", 2);
          headerMsg.display();

          div.remove();
        } else {
          const headerMsg = new HeaderMessage("An error occurred when deleting the show entry.", "red", 2);
          headerMsg.display();
        }

        loadingAnimation.end();
      });
    } else {
      element.text("Confirm");
    }
  });

  if (datum.archived) {
    div.find(".admin-shows-entry-archive").text("Unarchive");
  }

  div.find(".admin-shows-entry-archive").click(e => {
    let element = $(e.target);

    let archived = element.text() === "Archive";
    
    const loadingAnimation = new LoadingAnimation(element);
    loadingAnimation.start();

    fetch("/api/shows/update-info", {
      method: "POST",
      body: JSON.stringify({
        password: adminPassword,
        id: datum.id,
        archived: archived
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        const headerMsg = new HeaderMessage("Show entry archived successfully.", "green", 2);
        headerMsg.display();
        loadingAnimation.end();

        element.css("width", "auto");
        if (archived) {
          element.text("Unarchive");
        } else {
          element.text("Archive");
        }
      } else {
        const headerMsg = new HeaderMessage("An error occurred when archiving the show entry.", "red", 2);
        headerMsg.display();
        loadingAnimation.end();
      }
    });
  });

  $("#admin-shows-entries").append(div);
}

fetch("/api/shows/data")
  .then(response => response.json())
  .then(data => {
    data = data.data;
    data = data.filter(datum => !datum.archived).concat(data.filter(datum => datum.archived));

    for (let datum of data) {
      createShowEntry(datum);
    }
  });

// admin logo editor
$("#admin-site-logo-upload")
  .on("change", e => {
    $("#admin-site-logo").attr("src", URL.createObjectURL(e.target.files[0]));
  });

$("#admin-site-logo-save").click(() => {
  const loadingAnimation = new LoadingAnimation($("#admin-site-logo-save"));
  loadingAnimation.start();

  let formData = new FormData();
  formData.append("password", adminPassword);
  formData.append("file", $("#admin-site-logo-upload").get(0).files[0]);

  fetch("/api/logo", {
    method: "post",
    body: formData,
  })
  .then(response => response.json())
  .then(response2 => {
    if (response2.status === "success") {
      const headerMsg = new HeaderMessage("Logo updated successfully.", "green", 2);
      headerMsg.display();
    } else {
      const headerMsg = new HeaderMessage("An error occurred when updating the logo.", "red", 2);
      headerMsg.display();
    }

    loadingAnimation.end();
  });
});

$("#admin-site-logo-reset").click(() => {
  $("#admin-site-logo").attr("src", "/api/logo");
  $("#admin-site-logo-unpload").val(null);
});

// font import
$("#admin-site-font-form").submit(e => {
  e.preventDefault();
  const loadingAnimation = new LoadingAnimation($("#admin-site-font-import-submit"));
  loadingAnimation.start();

  const importStr = $("#admin-site-font-import").val();
  const fontName = $("#admin-site-font-name").val();

  if (importStr.substring(0, 5) === "<link") {
    fetch("/api/font/import", {
      method: "POST",
      body: JSON.stringify({
        password: adminPassword,
        embed: importStr,
        name: fontName
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        const headerMsg = new HeaderMessage("Font imported successfully.", "green", 2);
        headerMsg.display();
        $("#admin-site-font-import").val(null);
        $("#admin-site-font-name").val(null);

        // add option to font selectors
        let option = $(`<option name="${fontName}">${fontName}</option>`);
        $("#admin-site-header-font").append(option.clone());
        $("#admin-site-main-font").append(option.clone());
      } else {
        const headerMsg = new HeaderMessage("An error occurred when importing the font.", "red", 2);
        headerMsg.display();
      }

      loadingAnimation.end();
    });
  } else {
    const headerMsg = new HeaderMessage("The font import is invalid.", "red", 2);
    headerMsg.display();
    loadingAnimation.end();
  }
});

// load font options
function loadFontOptions() {
  fetch("/api/settings")
    .then(response => response.json())
    .then(response => {
      for (let font of response.data.fonts) {
        let option = $(`<option name="${font}">${font}</option>`);
        $("#admin-site-header-font").append(option.clone());
        $("#admin-site-main-font").append(option.clone());
      }

      $("#admin-site-header-font").val(response.data.headerFont);
      $("#admin-site-main-font").val(response.data.mainFont);
    });
}

loadFontOptions();

// submit fonts
$("#admin-site-font-save").click(() => {
  const loadingAnimation = new LoadingAnimation($("#admin-site-font-save"));
  loadingAnimation.start();

  fetch("/api/font/set", {
    method: "POST",
    body: JSON.stringify({
      password: adminPassword,
      headerFont: $("#admin-site-header-font").val(),
      mainFont: $("#admin-site-main-font").val()
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(response => {
    if (response.status === "success") {
      const headerMsg = new HeaderMessage("Fonts updated successfully.", "green", 2);
      headerMsg.display();
    } else {
      const headerMsg = new HeaderMessage("An error occurred when updating the fonts.", "red", 2);
      headerMsg.display();
    }

    loadingAnimation.end();
  });
});

// reset fonts
$("#admin-site-font-import-reset").click(() => {
  if ($("#admin-site-font-import-reset").text() === "Confirm") {
    const loadingAnimation = new LoadingAnimation($("#admin-site-font-import-reset"));
    loadingAnimation.start();
    
    fetch("/api/font/reset", {
      method: "POST",
      body: JSON.stringify({
        password: adminPassword
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response => {
      if (response.status === "success") {
        const headerMsg = new HeaderMessage("Fonts reset successfully.", "green", 2);
        headerMsg.display();
      } else {
        const headerMsg = new HeaderMessage("An error occurred when reseting the fonts.", "red", 2);
        headerMsg.display();
      }
  
      loadingAnimation.end();
      $("#admin-site-font-import-reset").css("width", "auto");
      $("#admin-site-font-import-reset").text("Reset Fonts");
    });
  } else {
    $("#admin-site-font-import-reset").text("Confirm");
  }
});