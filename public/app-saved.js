$(document).on("click", ".btn", function() {
    $("#notes").empty();
    var thisId = $(this).attr("btn-id");
    $.ajax({
        method: "GET",
        url: "/articles/" + thisId
    }).done(function(data) {
      $("#notes").append("<h2>" + data.title + "</h2>");
      $("#notes").append("<input id='titleinput' name='title' >");
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
      if (data.note) {
        $("#titleinput").val(data.note.title);
        $("#bodyinput").val(data.note.body);
    }
});
});

$(document).on("click", "#savenote", function() {
  var thisId = $(this).attr("data-id");
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      title: $("#titleinput").val(),
      body: $("#bodyinput").val()
  }
}).done(function(data) {
    location.reload();
});
  $("#titleinput").val("");
  $("#bodyinput").val("");
});