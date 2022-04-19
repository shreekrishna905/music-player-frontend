window.onload = function () {
  let audio = new Audio();

  let state = {
    playType:null
  }

  function resetAudio(){
      if(state.playType!=null){
        document.getElementById(state.playType).style.backgroundColor = '';
        state.playType = null;
      }
      audio.pause();
      document.getElementById('song-title').innerHTML ='';
      document.getElementById('current-time').innerHTML='00:00:00';
      document.getElementById('finish-time').innerHTML='00:00:00';
      audio = new Audio();
      audio.addEventListener('ended', audioEndListner);
  }

  function showSearch(){
    document.getElementById('login-info').classList.remove("d-flex");
    document.getElementById('login-info').style.display='none';
    document.getElementById('search-info').classList= "d-flex";
  }

  function showLogin(){
    document.getElementById('search-info').classList.remove("d-flex");
    document.getElementById('search-info').style.display='none';
    document.getElementById('login-info').classList = "d-flex";
    document.getElementById('song-container').remove();
    document.getElementById('playlist-container').remove();
    document.getElementById('heading').style.display='block';
    document.getElementById('footer').style.display='none';
    resetAudio();
  }
  
  function audioPlayer(source, data,title) {
    console.log(source);
    document.getElementById("song-title").innerHTML = title;
    let play = document.getElementById("play-pause-link");
    play.setAttribute("data-id",data);
    let currentTime = document.getElementById("current-time");
    let finishTime = document.getElementById("finish-time");
    let progressBar = document.getElementById("progress-bar");
    audio.setAttribute('src',source); //change the source
    audio.load(); //load the new source
    play.onclick = function () {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };

    audio.onplay = function () {
      play.innerHTML = `<i class="fa fa-pause"></i>`;
    };

    audio.onpause = function () {
      play.innerHTML = `<i class="fa fa-play"></i>`;
    };

    audio.onloadedmetadata = function () {
      currentTime.innerHTML = timeFormat(0);
      finishTime.innerHTML = timeFormat(audio.duration);
      progressBar.max = Math.floor(audio.duration);
      let processing = false;
      progressBar.oninput = function () {
        processing = true;
      };
      progressBar.onchange = function () {
        audio.currentTime = progressBar.value;
        if (!audio.paused) {
          audio.play();
        }
        processing = false;
      };
      audio.ontimeupdate = function () {
        if (!processing) {
          progressBar.value = Math.floor(audio.currentTime);
          currentTime.innerHTML = timeFormat(audio.currentTime);
        }
      };
    };
  }

  function timeFormat(secs) {
    let ss = Math.floor(secs),
      hh = Math.floor(ss / 3600),
      mm = Math.floor((ss - hh * 3600) / 60);
    ss = ss - hh * 3600 - mm * 60;
    if (hh > 0) {
      mm = mm < 10 ? "0" + mm : mm;
    }
    ss = ss < 10 ? "0" + ss : ss;
    return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  if (sessionStorage.getItem("access_token")) {
    showSearch();
    renderSongsAndPlaylist();
  }

  document.getElementById("logout").onclick = function(event) {
    event.preventDefault();
    showLogin();
    sessionStorage.clear();
  }

  document.getElementById("login").onclick = function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    if (username == "" || password == "") {
      return;
    }
    console.log("Sending credentials to server");
    login(username, password);
  };

  async function login(username, password) {
    let result = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }).then((res) => res.json());
    if (result.hasOwnProperty("access_token")) {
      sessionStorage.setItem("access_token", result.access_token);
      showSearch();
      renderSongsAndPlaylist();
      
    } else {
      document.getElementById("error-login").innerHTML =
        "Invalid Username or Password";
    }
  }

  async function renderSongsAndPlaylist() {
    await getSongs();
    await getPlaylists();
  }


  async function getSongs() {
    let songs = await fetch("http://localhost:3000/api/songs", {
      method: "GET",
      headers: {
        "x-access-token": sessionStorage.getItem("access_token"),
      },
    }).then((response) => response.json());
    sessionStorage.setItem("songs", JSON.stringify(songs));
    createSongTable();
    let songListTable = document
      .getElementById("song-list")
      .getElementsByTagName("tbody")[0];
    songs.forEach((element) => {
      addSongRow(songListTable,element, (event) => {
        event.preventDefault();
        addSongToPlayList(element)
      });
    });
  }

  

  const createSongTable = () => {
    document.getElementById("heading").style.display = "none";
    const div = document.createElement("div");
    div.id = "song-container";
    div.innerHTML = `<h1> Song you may interest</h1>`;
    const songTable = document.createElement("table");
    songTable.classList = "table  table-bordered";
    songTable.id = "song-list";
    songTable.innerHTML = `<thead>
                                <tr>
                                    <th scope="col">Id</th>
                                    <th scope="col">Title</th>
                                    <th scope="col">Release Date</th>
                                    <th scope="col">Action</th>
                                </tr>
                            </thead><tbody></tbody>`;
    div.appendChild(songTable);
    document.getElementById("container-fluid").appendChild(div);
  }


  const  addSongRow = (table,element, callback) => {
      let row = table.insertRow();
      let id = row.insertCell(0);
      let title = row.insertCell(1);
      let releaseDate = row.insertCell(2);
      let action = row.insertCell(3);
      id.innerHTML = element.id;
      title.innerHTML = element.title;
      releaseDate.innerHTML = element.releaseDate;
      const addSong = document.createElement('button');
      addSong.setAttribute("data-id", element.id);
      addSong.addEventListener("click", callback);
      addSong.classList = "btn btn-sm";
      addSong.innerHTML = '<i class="fa-solid fa-plus"></i>';
      action.append(addSong);
  }

  const addPlaylistRow = (table,element) => {
        let row = table.insertRow();
        let id = row.insertCell(0);
        let title = row.insertCell(1);
        let action = row.insertCell(2);
        id.innerHTML = element.id;
        title.innerHTML = element.title;
        const actionDiv = document.createElement("div");
        actionDiv.classList = "d-grid gap-2 d-md-flex";
        const removeSong = document.createElement("button");
        removeSong.setAttribute("data-id", element.id);
        removeSong.addEventListener("click", function (event) {
          event.preventDefault();
          console.log(`Removing song ${element.id}`);
          fetch('http://localhost:3000/api/playlists/tracks/' + element.id, {
            method: 'DELETE',
            headers: {
              "x-access-token": sessionStorage.getItem("access_token"),
          },
        }).then(response => {
            if(response.status==200){
              alert('Delete successfully');
            }
            row.remove();
            let playlist = JSON.parse(sessionStorage.getItem('playlists'));
            let index = playlist.findIndex(song => song.id==element.id);
            if(index>-1){
              playlist.splice(index,1);
            }
            if(playlist.length===0){
              document.getElementById('playlist-container').remove();
              emptyPlaylist();
            }
            sessionStorage.setItem('playlists',JSON.stringify(playlist));
            let currentPlay = document.getElementById('play-pause-link').dataset.id;
            if(currentPlay==element.id){
              resetAudio();
            }
        });
        });
        removeSong.classList = "btn btn-sm remove-song";
        removeSong.innerHTML = '<i class="fa-solid fa-minus"></i>';
        const playSong = document.createElement("button");
        playSong.addEventListener("click", function (event) {
          event.preventDefault();
          console.log(`Playing song ${element.id}`);
          audioPlayer(element.source, element.id,element.title);
          document.getElementById("play-pause-link").click();
        });
        playSong.classList = "btn btn-sm play-song";
        playSong.innerHTML = '<i class="fa-solid fa-play"></i>';
        actionDiv.append(removeSong);
        actionDiv.append(playSong);
        action.append(actionDiv);
  }

  async function addSongToPlayList(element) {
    const result = await fetch('http://localhost:3000/api/playlists/tracks', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            "x-access-token": sessionStorage.getItem("access_token"),
        },
        body: JSON.stringify({
            id: element.id,
            title: element.title,
            releaseDate: element.releaseDate,
            source:element.source
        })
    }).then(res => {
      if(res.status===200){
        if(sessionStorage.getItem('playlists')==null){
          sessionStorage.setItem('playlists', JSON.stringify([]));
        } 
        let songIndex = JSON.parse(sessionStorage.getItem('playlists')).findIndex(song => song.id==element.id);
        if(songIndex<0){
          if(JSON.parse(sessionStorage.getItem('playlists')).length==0){
            document.getElementById('playlist-container').remove();
            playlistTables();
          }
          let playlistTable = document
          .getElementById("playlist")
          .getElementsByTagName("tbody")[0];
          addPlaylistRow(playlistTable, element);
          let playlist = JSON.parse(sessionStorage.getItem('playlists'));
          playlist.push(element);
          sessionStorage.setItem('playlists', JSON.stringify(playlist));
          alert('Added successfully');
        } 
      }
    });
}

  async function getPlaylists() {
    let playlists = await fetch("http://localhost:3000/api/playlists", {
      method: "GET",
      headers: {
        "x-access-token": sessionStorage.getItem("access_token"),
      },
    }).then((response) => response.json());
    if (playlists.length > 0) {
      sessionStorage.setItem("playlists", JSON.stringify(playlists));
      playlistTables();
      let playListTable = document
        .getElementById("playlist")
        .getElementsByTagName("tbody")[0];
      playlists.forEach((element) => {
        addPlaylistRow(playListTable,element);
      });
    } else {
      emptyPlaylist();
    }
  }

  function playlistTables() {
    const div = document.createElement("div");
    div.classList = "content";
    div.id='playlist-container';
    div.innerHTML = `<h1>Your Playlist</h1>`;
    const playlistTable = document.createElement("table");
    playlistTable.classList = "table  table-bordered";
    playlistTable.id = "playlist";
    playlistTable.innerHTML = `<thead>
                                <tr>
                                    <th scope="col">Id</th>
                                    <th scope="col">Title</th>
                                    <th scope="col">Action</th>
                                </tr>
                            </thead><tbody></tbody>`;
    div.appendChild(playlistTable);
    document.getElementById("container-fluid").appendChild(div);
    document.getElementById('footer').style.display='block';
  }

  function emptyPlaylist() {
    document.getElementById('footer').style.display='none';
    console.log(state.playType);
    if(state.playType!=null){
      document.getElementById(state.playType).style.backgroundColor = '';
      state.playType = null;
      resetAudio();
    }
    if(audio.played){
      resetAudio();
    }
    const div = document.createElement("div");
    div.classList = "content";
    div.id='playlist-container';
    div.innerHTML = `<h1>Your Playlist</h1><h2>No Songs in your playlist</h2>`;
    document.getElementById("container-fluid").appendChild(div);
  }

  document.getElementById('previous').onclick = function(){
    let data = document.getElementById('play-pause-link').dataset.id;
    console.log('Previous Click',data);
    if(data){
        let playlists = JSON.parse(sessionStorage.getItem("playlists"));
        let currentIndex = playlists.findIndex(playlist => playlist.id==data);
        console.log(currentIndex);
        if(currentIndex==0){
            audioPlayer(playlists[playlists.length-1].source, playlists[playlists.length-1].id,playlists[playlists.length-1].title);
            document.getElementById("play-pause-link").click();
        } else {
            currentIndex--;
            audioPlayer(playlists[currentIndex].source, playlists[currentIndex].id,playlists[currentIndex].title);
            document.getElementById("play-pause-link").click();
        }
    }
  }

  document.getElementById('next').onclick = function(){
    
    let data = document.getElementById('play-pause-link').dataset.id;
    console.log('current id',data);
    if(data){
        let playlists = JSON.parse(sessionStorage.getItem("playlists"));
        console.log(playlists);
        let currentIndex = playlists.findIndex(playlist => playlist.id==data);
        console.log(currentIndex,playlists[playlists.length-1].id);
        if(currentIndex!=(playlists.length-1)){
            currentIndex++;
            audioPlayer(playlists[currentIndex].source, playlists[currentIndex].id,playlists[currentIndex].title);
            document.getElementById("play-pause-link").click();
        } else {
            audioPlayer(playlists[0].source, playlists[0].id, playlists[0].title);
            document.getElementById("play-pause-link").click();
        }
    }
  }

  document.getElementById('infinite').onclick = function() {
    if(state.playType=='infinite'){
      document.getElementById(state.playType).style.backgroundColor = '';
      state.playType = null;
      return;
    }
    if(state.playType){
      document.getElementById(state.playType).style.backgroundColor = '';
    }
    state.playType='infinite';
    this.style.backgroundColor = 'salmon';
    audio.loop=false;
  }

  document.getElementById('single-infinite').onclick = function() {
    if(state.playType=='single-infinite'){
      document.getElementById(state.playType).style.backgroundColor = '';
      state.playType = null;
      audio.loop = false;
      return;
    }
    if(state.playType){
      document.getElementById(state.playType).style.backgroundColor = '';
    }
    state.playType='single-infinite';
    this.style.backgroundColor = 'salmon';
    audio.loop = true;
  }

  document.getElementById('shuffle').onclick = function() {
    if(state.playType=='shuffle'){
      document.getElementById(state.playType).style.backgroundColor = '';
      state.playType = null;
      return;
    }
    if(state.playType){
      document.getElementById(state.playType).style.backgroundColor = '';
    }
    state.playType='shuffle';
    this.style.backgroundColor = 'salmon';
    audio.loop=false;
  }

  const audioEndListner = () => {
    console.log('audio has been ended');
    switch(state.playType) {
      case 'infinite':
        document.getElementById('next').click();
        break;
      case 'shuffle':
        const current = document.getElementById('play-pause-link').dataset.id;
        let playlists = JSON.parse(sessionStorage.getItem("playlists"));
        let randomTrack = playlists[Math.floor(Math.random()*playlists.length)];
        while(randomTrack.id==current){
          randomTrack = playlists[Math.floor(Math.random()*playlists.length)];
        }
        console.log('current track id:', current,' random id track:', randomTrack.id);
        audioPlayer(randomTrack.source, randomTrack.id,randomTrack.title);
        document.getElementById("play-pause-link").click();
        break;
      default:
    }
  }

  audio.addEventListener('ended', audioEndListner);


};
