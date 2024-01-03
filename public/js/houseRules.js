// retrieve and insert page text
fetch("/api/general-page/houseRules/text")
  .then(response => response.json())
  .then(data => {
    if (data.status === "success") {
      $("#page-text").html(data.data);
    }
  });

// retrieve image extension and set image source
fetch("/api/general-page/extensions")
  .then(response => response.json())
  .then(data => {
    if (data.status === "success") {
      let extension = data.data.houseRules;
      $("#page-image").attr("src", "/public/images/houseRules/houseRules." + extension);
    }
  });