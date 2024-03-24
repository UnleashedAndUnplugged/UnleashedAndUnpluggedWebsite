// load fonts
fetch("/public/components/fontLinks.html")
  .then(response => response.text())
  .then(response => {
    $("head").append($(response));
  });