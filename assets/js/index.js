const apiUrl = 'https://www.mp3quran.net/api/v3';
const radioApi = "https://www.mp3quran.net/api/v3/radios?language=ar";
const language = 'ar';

let hls = null;

async function getReciters() {
    const chooseReciter = document.querySelector('#chooseReader');

    const res = await fetch(`${apiUrl}/reciters?language=${language}`);
    const data = await res.json();

    chooseReciter.innerHTML = '<option value="">اختر القارئ...</option>';

    data.reciters.forEach(reciter => {
        chooseReciter.innerHTML += `
            <option value="${reciter.id}">
                ${reciter.name}
            </option>
        `;
    });

    chooseReciter.onchange = (e) => {
        getMoshaf(e.target.value);
    };
}

async function getMoshaf(reciterId) {

    const chooseMoshaf = document.querySelector('#chooseNarration');
    const chooseSurah = document.querySelector('#chooseSurah');

    chooseMoshaf.innerHTML = '<option value="">اختر الرواية...</option>';
    chooseSurah.innerHTML = '<option value="">اختر السورة...</option>';

    if (!reciterId) return;

    const res = await fetch(`${apiUrl}/reciters?language=${language}&reciter=${reciterId}`);
    const data = await res.json();

    const moshafs = data.reciters[0].moshaf;

    moshafs.forEach(moshaf => {

        const option = document.createElement("option");

        option.textContent = moshaf.name;
        option.value = moshaf.id;
        option.dataset.server = moshaf.server;
        option.dataset.surahlist = moshaf.surah_list;

        chooseMoshaf.appendChild(option);
    });

    chooseMoshaf.onchange = () => {

        const option = chooseMoshaf.options[chooseMoshaf.selectedIndex];

        getSurah(
            option.dataset.server,
            option.dataset.surahlist
        );

    };

}

async function getSurah(server, surahList) {

    const chooseSurah = document.querySelector('#chooseSurah');

    if (!surahList) return;

    const res = await fetch(`${apiUrl}/suwar`);
    const data = await res.json();

    chooseSurah.innerHTML = '<option value="">اختر السورة...</option>';

    surahList.split(',').forEach(id => {

        const surah = data.suwar.find(s => s.id == id.trim());

        if (surah) {

            chooseSurah.innerHTML += `
                <option value="${server}${id.trim().padStart(3,'0')}.mp3">
                    سورة ${surah.name}
                </option>
            `;

        }

    });

    chooseSurah.onchange = function () {

        const audio = document.querySelector("audio");

        if (!this.value) return;

        audio.src = this.value;
        audio.load();
        audio.play();

    };

}

function playlive(url) {

    const video = document.querySelector("video");

    if (!video) return;

    if (hls) {
        hls.destroy();
        hls = null;
    }

    // Safari
    if (video.canPlayType("application/vnd.apple.mpegurl")) {

        video.src = url;
        video.load();
        video.play();
        return;

    }

    if (Hls.isSupported()) {

        hls = new Hls();

        hls.loadSource(url);

        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function () {

            video.play();

        });

        hls.on(Hls.Events.ERROR, function (event, data) {

            console.error(data);

        });

    } else {

        alert("المتصفح لا يدعم تشغيل البث المباشر.");

    }

}

async function getRadios() {
    const chooseRadio = document.querySelector("#chooseRadio");
    const radioPlayer = document.querySelector("#radioPlayer");
    const playRadio = document.querySelector("#playRadio");

    if (!chooseRadio || !radioPlayer) return;

    try {
        const res = await fetch(radioApi); 
        const data = await res.json();

        chooseRadio.innerHTML = ' <option value=""> --اختر الإذاعة...</option>';

        data.radios.forEach(radio => {
            chooseRadio.innerHTML += `
                <option value="${radio.url}">
                    ${radio.name}
                </option>
            `;
        });

        chooseRadio.onchange = function () {
            if (!this.value) return;
            radioPlayer.src = this.value;
            radioPlayer.load();
        };

        if (playRadio) {
            playRadio.onclick = function () {
                if (!chooseRadio.value) {
                    alert("اختر إذاعة أولاً");
                    return;
                }
                if (radioPlayer.src !== chooseRadio.value) {
                    radioPlayer.src = chooseRadio.value;
                    radioPlayer.load();
                }
                radioPlayer.play();
            };
        }

    } catch (error) {
        console.error("Radio Error:", error);
    }
}
document.addEventListener("DOMContentLoaded", function () {
    getRadios();
    getReciters();
});
document.addEventListener("DOMContentLoaded", function() {
        const tafsirSelect = document.getElementById('tafsir-select');
        const playBtn = document.getElementById('play-tafsir-btn');
        const audioPlayer = document.getElementById('tafsirPlayer');
        
        fetch('https://mp3quran.net/api/v3/tafsir?tafsir=1&language=ar')
            .then(response => response.json())
            .then(data => {
                tafsirSelect.innerHTML = '<option value="">-- اختر السورة أو المقطع لتفسير الطبري --</option>';
                if(data.tafasir && data.tafasir.soar) {
                    data.tafasir.soar.forEach(sura => {
                        const option = document.createElement('option');
                        option.value = sura.url;
                        option.textContent = sura.name;
                        tafsirSelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                tafsirSelect.innerHTML = '<option value="">حدث خطأ أثناء تحميل البيانات</option>';
            });

        tafsirSelect.addEventListener('change', function() {
            playBtn.disabled = !this.value;
        });

        playBtn.addEventListener('click', function() {
            const audioUrl = tafsirSelect.value;
            if(audioUrl) {
                audioPlayer.src = audioUrl;
                audioPlayer.play();
            }
        });
    });
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
        $('.loader').fadeToggle();
    }, 1500);

    $("a[href='#top']").click(function () {
        $("html, body").animate({ scrollTop: 0 }, "slow");
        return false;
    });

    const quranSelect = document.getElementById('quran-select');
    const showBtn = document.getElementById('show-quran-btn');
    const surahContainer = document.getElementById('surah-container');
    const surahTitle = document.getElementById('surah-title');
    const surahText = document.getElementById('surah-text');

    if (quranSelect) {
        fetch('https://api.alquran.cloud/v1/surah')
            .then(response => response.json())
            .then(data => {
                quranSelect.innerHTML = '<option value="">-- اختر السورة لقراءتها --</option>';
                if (data.data) {
                    data.data.forEach(surah => {
                        const option = document.createElement('option');
                        option.value = surah.number; 
                        option.textContent = `${surah.number}.${surah.name} (${surah.numberOfAyahs} آية)`;
                        quranSelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching surahs:', error);
                quranSelect.innerHTML = '<option value="">حدث خطأ أثناء تحميل القائمة</option>';
            });

        quranSelect.addEventListener('change', function () {
            if (showBtn) showBtn.disabled = !this.value;
        });
    }

    if (showBtn) {
        showBtn.addEventListener('click', function () {
            const surahNumber = quranSelect.value;
            if (!surahNumber) return;

            showBtn.innerHTML = 'جاري التحميل... <i class="fa fa-spinner fa-spin"></i>';

            fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`)
                .then(response => response.json())
                .then(data => {
                    showBtn.innerHTML = '📖 عرض السورة';

                    if (data.data) {
                        const surah = data.data;
                        surahTitle.innerHTML = `✨ ${surah.name} ✨`;

                        let htmlContent = "";

                        if (surahNumber != 1 && surahNumber != 9) {
                            htmlContent += `<div style="text-align:center; font-weight:bold; color:#1b4d3e; margin-bottom:15px; font-size:24px;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
                        }

                        surah.ayahs.forEach(ayah => {
                            let text = ayah.text;
                            if (surahNumber != 1 && ayah.numberInSurah === 1 && text.startsWith("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ")) {
                                text = text.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ", "");
                            }
                            htmlContent += `${text} <span class="ayah-number">${ayah.numberInSurah}</span> `;
                        });

                        surahText.innerHTML = htmlContent;
                        surahContainer.style.display = 'block'; 

                        surahContainer.scrollIntoView({ behavior: 'smooth' });
                    }
                })
                .catch(error => {
                    console.error('Error fetching verses:', error);
                    showBtn.innerHTML = '📖 عرض السورة';
                    alert('حدث خطأ أثناء تحميل آيات السورة، يرجى المحاولة مجدداً.');
                });
        });
    }
});