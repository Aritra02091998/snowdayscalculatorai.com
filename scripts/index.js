/* ========= GLOBALS ========= */
const GEOCODE_APIKEY="680f928454bd6907926580ftwca9e41";
const stateSelect   = document.getElementById("stateSelect");
const zipcodeInput  = document.getElementById("zipcodeInput");
const addressInput  = document.getElementById("addressInput");
const loader        = document.getElementById("loader");
let   currentForecast=[];

/* ========= input behaviour ========= */
stateSelect.addEventListener("change",()=>{
    zipcodeInput.disabled = !stateSelect.value;
    if(stateSelect.value){
        addressInput.disabled = true;
        addressInput.value    = "";
    }else{
        addressInput.disabled = false;
    }
});
addressInput.addEventListener("input",()=>{
    if(addressInput.value.trim()){
        stateSelect.disabled  = true;
        zipcodeInput.disabled = true;
        stateSelect.value     = "";
        zipcodeInput.value    = "";
    }else{
        stateSelect.disabled  = false;
        zipcodeInput.disabled = !stateSelect.value;
    }
});
function showInputs(flag){
    document.getElementById("inputContainer")
            .classList.toggle("hidden-section",!flag);
}

/* ========= API helpers ========= */
async function callApiChain(addr){
    const geo = await fetch("https://geocode.maps.co/search?"+
                 new URLSearchParams({q:addr,api_key:GEOCODE_APIKEY}))
                 .then(r=>{if(!r.ok)throw`Geocode ${r.status}`;return r.json()});
    if(!geo.length)throw"Address not found";
    const {lat,lon}=geo[0];

    const points = await fetch(`https://api.weather.gov/points/${lat},${lon}`)
                   .then(r=>{if(!r.ok)throw`Points ${r.status}`;return r.json()});
    return fetch(points.properties.forecast)
           .then(r=>{if(!r.ok)throw`Forecast ${r.status}`;return r.json()})
           .then(j=>j.properties.periods);
}

function processForecast(periods){
    const today=new Date();today.setHours(0,0,0,0);
    const upcoming=[0,1,2].map(i=>{const d=new Date(today);
        d.setDate(today.getDate()+i);return d.toLocaleDateString("en-CA");});
    const daily={};
    periods.forEach(p=>{
        const k=p.startTime.slice(0,10);
        if(!upcoming.includes(k))return;
        const snow=/snow|blizzard/i.test(p.shortForecast);
        const pop=p.probabilityOfPrecipitation?.value;
        if(!daily[k])
            daily[k]={snow,temp:p.temperature||'N/A',forecast:p.shortForecast,popSum:0,popCnt:0};
        daily[k].snow||=snow;
        if(pop!=null){daily[k].popSum+=pop;daily[k].popCnt++;}
    });
    return upcoming.map(k=>{
        if(!daily[k])return null;
        const dObj=new Date(k),inF=daily[k];
        const avg=inF.popCnt?Math.round(inF.popSum/inF.popCnt):0;
        return{
            date:dObj.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}),
            snow:inF.snow,temp:inF.temp,forecast:inF.forecast,
            chance:inF.snow?Math.max(avg,70):Math.round(avg*0.15)
        };
    }).filter(Boolean);
}

/* ========= calculate ========= */
async function calculateProbability(){
    let addr=addressInput.value.trim();
    if(!addr && stateSelect.value && zipcodeInput.value.trim())
        addr=`${zipcodeInput.value.trim()}, ${stateSelect.selectedOptions[0].text}`;
    if(!addr){alert("Please provide location information");return;}

    loader.style.display="flex";
    try{
        const periods=await callApiChain(addr);
        currentForecast=processForecast(periods);

        const wrap=document.getElementById("forecastResults");
        wrap.innerHTML=currentForecast.map(d=>`
            <div class="forecast-card">
                <div class="status-label ${d.snow?'snow':'clear'}">
                    ${d.snow?'High chance of Snow Day ❄️':'No Snow Expected ☀️'}
                </div>
                <div>Date: ${d.date}</div>
                <div>Condition: ${d.forecast}</div>
                <div>Temperature: ${d.temp}°F</div>
                <div class="progress-wrap"><div class="progress-fill" style="width:${d.chance}%"></div></div>
                <div class="status-label ${d.snow?'snow':'clear'}" style="margin-top:1rem">
                    ${d.snow?'Schools likely closed! Stay safe!':'Normal school day expected'}
                </div>
            </div>`).join("");

        document.getElementById("results").style.display="block";
        showInputs(false);
    }catch(e){
        console.error(e);
        forecastResults.innerHTML=`<div class="forecast-card">❌ Error: ${e}</div>`;
    }finally{loader.style.display="none";}
}

/* ========= reset ========= */
function resetCalculator(){
    stateSelect.value="";zipcodeInput.value="";addressInput.value="";
    stateSelect.disabled=false;zipcodeInput.disabled=true;addressInput.disabled=false;
    document.getElementById("forecastResults").innerHTML="";
    document.getElementById("results").style.display="none";
    showInputs(true);
    window.scrollTo({top:0,behavior:'smooth'});
}

/* ========= FAQ toggle ========= */
function toggleFAQ(el){
    const ans=el.nextElementSibling;
    ans.style.display=ans.style.display==='block'?'none':'block';
}

/* ========= PDF export ========= */
function generatePDF(){
    if(!currentForecast.length){alert("Please calculate a forecast first.");return;}

    const doc=new jspdf.jsPDF({orientation:"p",unit:"mm",format:"a4"});
    const pageW=doc.internal.pageSize.getWidth();
    const mX=15,headerH=26,gap=14,cardH=40;
    let y=headerH+gap;

    /* header strip */
    doc.setFillColor(32,87,129).rect(0,0,pageW,headerH,"F");
    doc.setFont("helvetica","bold").setFontSize(19).setTextColor(255,255,255)
       .text("Snow-Day Forecast Report",pageW/2,16,{align:"center"});

    /* cards */
    doc.setFont("helvetica","normal").setFontSize(12).setTextColor(0,0,0);
    currentForecast.forEach((d,idx)=>{
        const tint=d.snow?{r:200,g:242,b:248}:{r:238,g:240,b:243};
        doc.setFillColor(tint.r,tint.g,tint.b);
        doc.roundedRect(mX,y-2,pageW-mX*2,cardH,3,3,"F");

        doc.setFont("helvetica","bold").text(d.date,mX+4,y+8);
        doc.setFont("helvetica","normal")
           .text(`Condition : ${d.forecast}`,mX+4,y+18)
           .text(`Temperature: ${d.temp}°F`,mX+4,y+26);

        const status=d.snow?"School likely CLOSED":"School expected OPEN";
        const col=d.snow?{r:183,g:28,b:28}:{r:27,g:94,b:32};
        doc.setTextColor(col.r,col.g,col.b).setFont("helvetica","bold")
           .text(status,pageW-mX-4,y+18,{align:"right"})
           .setTextColor(0,0,0);

        y+=cardH+10;
        if(y+cardH>doc.internal.pageSize.getHeight()-30 && idx<currentForecast.length-1){
            doc.addPage();y=20;
        }
    });

    /* promo + timestamp */
    if(y+14>doc.internal.pageSize.getHeight()-15){doc.addPage();y=20;}
    doc.setFontSize(14).setFont("helvetica","normal");
    const before="Generated from ";
    const link="snowdayscalculatorai.com";
    const after=" – visit for more forecasts!";
    let x=mX;
    doc.setTextColor(0,0,0).text(before,x,y);x+=doc.getTextWidth(before);
    doc.setTextColor(32,87,129).text(link,x,y);
    doc.link(x,y-5,doc.getTextWidth(link),6,{url:"https://snowdayscalculatorai.com"});
    x+=doc.getTextWidth(link);
    doc.setTextColor(0,0,0).text(after,x,y);
    doc.text(`Generated on: ${new Date().toLocaleString()}`,mX,y+7);

    doc.save("snow-day-report.pdf");
}
