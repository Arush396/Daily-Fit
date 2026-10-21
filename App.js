import React,{useState,useEffect,useRef} from 'react';
import {View,Text,TextInput,TouchableOpacity as T,ScrollView,StatusBar,Image,Alert,Platform,KeyboardAvoidingView} from 'react-native';
import {LinearGradient as G} from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as N from 'expo-notifications';
import {Pedometer} from 'expo-sensors';
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';

N.setNotificationHandler({handleNotification:async()=>({shouldShowAlert:true,shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});

const C={card:'#16133a',line:'#2b2663',tx:'#f5f2ff',mu:'#9d99c9',a:'#ff8a5c',b:'#2dd4bf',c:'#8b5cf6'};
const BG=['#0a0920','#14103a','#0c2236'];
const SUN=['#ff7a59','#c026d3','#4f46e5'];
const FOODS=[
{n:'egg',u:'1 egg',k:78,p:6},{n:'roti',u:'1 roti',k:100,p:3},{n:'rice',u:'1 cup rice',k:200,p:4},
{n:'dal',u:'1 bowl dal',k:180,p:12},{n:'paneer',u:'100 g paneer',k:265,p:18,g:100},{n:'chicken',u:'100 g chicken',k:165,p:31,g:100},
{n:'fish',u:'100 g fish',k:140,p:22,g:100},{n:'curd',u:'1 cup curd',k:100,p:6},{n:'milk',u:'1 glass milk',k:150,p:8},
{n:'banana',u:'1 banana',k:105,p:1},{n:'apple',u:'1 apple',k:95,p:1},{n:'oat',u:'1 bowl oats',k:150,p:5},
{n:'almond',u:'10 almonds',k:70,p:3},{n:'sprout',u:'1 bowl sprouts',k:120,p:9},{n:'peanut',u:'30 g peanuts',k:160,p:7,g:30},
{n:'soya',u:'50 g soya chunks',k:170,p:26,g:50},{n:'bread',u:'1 slice bread',k:80,p:3}];
const ACT={sed:['Desk job',1.2],light:['Light',1.375],mod:['Active',1.55],high:['Very active',1.725]};
const GOALS={lose:'Lose weight',keep:'Stay the same',gain:'Gain weight'};
const dk=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const E=()=>({steps:0,water:0,food:[]});
function tg(p){
  const t=(10*p.weight+6.25*p.height-5*p.age+(p.sex==='f'?-161:5))*ACT[p.act][1];
  const g=p.age<18?'keep':p.goal;
  let k=g==='lose'?t-500:g==='gain'?t+400:t;k=Math.max(k,p.sex==='f'?1200:1500);
  return{kcal:Math.round(k),protein:Math.round(p.weight*(g==='keep'?1.2:1.6)),water:Math.max(6,Math.round(p.weight*35/250))};
}
const plan=t=>[['Breakfast',.25,'Oats or 2 eggs, roti, milk'],['Lunch',.35,'Dal, rice, roti, sabzi, curd'],['Snack',.1,'Sprouts, nuts or a fruit'],['Dinner',.3,'Paneer or chicken, 2 roti, salad']].map(([n,f,i])=>({n,k:Math.round(t.kcal*f),p:Math.round(t.protein*f),i}));
const sum=(f,k)=>f.reduce((s,x)=>s+x[k],0);
function parse(t){
  const out=[];
  FOODS.forEach(f=>{const i=t.indexOf(f.n);if(i<0)return;const m=t.slice(0,i).match(/(\d+(?:\.\d+)?)\s*(?:[a-z]+\s+){0,2}$/);let q=m?+m[1]:1;if(f.g&&q>10)q=q/f.g;out.push({name:f.n,q:+q.toFixed(1),k:Math.round(f.k*q),p:Math.round(f.p*q)});});
  const kc=t.match(/(\d+)\s*(?:kcal|cal)/),pr=t.match(/(\d+)\s*g?\s*protein/);
  if(!out.length&&kc)out.push({name:'custom',q:1,k:+kc[1],p:pr?+pr[1]:0});
  return out;
}
const suggest=k=>{if(k<80)return'You are at your target, so stick to water for now.';const c=FOODS.filter(f=>f.k<=k).sort((a,b)=>b.p/b.k-a.p/a.k).slice(0,3);return'Next, try '+c.map(f=>`${f.u} (${f.k} kcal, ${f.p} g protein)`).join(', or ')+'.';};

async function sched(on){
  try{
    await N.cancelAllScheduledNotificationsAsync();
    if(!on)return;
    if(Platform.OS==='android')await N.setNotificationChannelAsync('default',{name:'Reminders',importance:N.AndroidImportance.HIGH});
    const r=await N.requestPermissionsAsync();if(r.status!=='granted')return;
    const ty=N.SchedulableTriggerInputTypes?N.SchedulableTriggerInputTypes.DAILY:'daily';
    const add=(hour,minute,title,body)=>N.scheduleNotificationAsync({content:{title,body},trigger:{type:ty,hour,minute,channelId:'default'}});
    for(const h of [9,11,13,15,17,19,21])await add(h,0,'Water break 💧','Drink a glass of water now.');
    await add(18,30,'Time to stride 👟','A short walk now helps you reach your step goal.');
    await add(20,30,'Log your meals 🍽','Tell the coach what you ate today.');
  }catch(e){}
}

const Card=({children,style})=><View style={[{backgroundColor:C.card,borderColor:C.line,borderWidth:1,borderRadius:20,padding:16,marginBottom:12},style]}>{children}</View>;
const H=({children})=><Text style={{color:C.tx,fontSize:18,fontWeight:'700',marginBottom:8}}>{children}</Text>;
const M=({children,style})=><Text style={[{color:C.mu,fontSize:13},style]}>{children}</Text>;
const Bar=({v,max,cols})=><View style={{height:10,borderRadius:5,backgroundColor:C.line,overflow:'hidden'}}><G colors={cols} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:10,width:`${Math.min(100,max?v/max*100:0)}%`}}/></View>;
const Btn=({t,onPress,cols=[C.a,'#c026d3'],style})=><T onPress={onPress} activeOpacity={.8} style={style}><G colors={cols} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:14,paddingVertical:13,paddingHorizontal:18,alignItems:'center'}}><Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>{t}</Text></G></T>;
const Chip=({t,on,onPress})=><T onPress={onPress} style={{paddingVertical:9,paddingHorizontal:14,borderRadius:20,borderWidth:1,borderColor:on?C.b:C.line,backgroundColor:on?'#12324a':'transparent',marginRight:8,marginBottom:8}}><Text style={{color:on?C.tx:C.mu,fontWeight:'600'}}>{t}</Text></T>;
const In=props=><TextInput placeholderTextColor={C.mu} {...props} style={[{backgroundColor:'#0f0d2b',color:C.tx,borderRadius:12,borderWidth:1,borderColor:C.line,paddingHorizontal:12,paddingVertical:10,fontSize:15,marginBottom:10},props.style]}/>;
const Row=({children,style})=><View style={[{flexDirection:'row',alignItems:'center'},style]}>{children}</View>;

function Form({onSave,first}){
  const [f,setF]=useState({name:'',age:'',height:'',weight:'',sex:'m',act:'light',goal:'lose'});
  const set=(k,v)=>setF({...f,[k]:v});
  const a=+f.age;
  const save=()=>{
    if(!f.name.trim()||!(a>=5&&a<=100)||!(+f.height>=80&&+f.height<=230)||!(+f.weight>=15&&+f.weight<=250))return Alert.alert('Check your details','Enter a name, age (5-100), height in cm and weight in kg.');
    onSave({id:String(Date.now()),name:f.name.trim(),age:a,height:+f.height,weight:+f.weight,sex:f.sex,act:f.act,goal:a<18?'keep':f.goal,goal2:8000});
  };
  return <View>
    <Card>
      <H>{first?'Welcome to Daily-Fit':'New profile'}</H>
      <M style={{marginBottom:12}}>Tell us about yourself and we will set your daily calories, protein, water and steps.</M>
      <In placeholder="Name" value={f.name} onChangeText={v=>set('name',v)}/>
      <Row style={{gap:8}}>
        <In style={{flex:1}} placeholder="Age" keyboardType="numeric" value={f.age} onChangeText={v=>set('age',v)}/>
        <In style={{flex:1}} placeholder="Height (cm)" keyboardType="numeric" value={f.height} onChangeText={v=>set('height',v)}/>
        <In style={{flex:1}} placeholder="Weight (kg)" keyboardType="numeric" value={f.weight} onChangeText={v=>set('weight',v)}/>
      </Row>
      <M style={{marginBottom:6}}>Sex (used for the calorie formula)</M>
      <Row><Chip t="Male" on={f.sex==='m'} onPress={()=>set('sex','m')}/><Chip t="Female" on={f.sex==='f'} onPress={()=>set('sex','f')}/></Row>
      <M style={{marginBottom:6}}>Daily activity</M>
      <Row style={{flexWrap:'wrap'}}>{Object.keys(ACT).map(k=><Chip key={k} t={ACT[k][0]} on={f.act===k} onPress={()=>set('act',k)}/>)}</Row>
      <M style={{marginBottom:6}}>Your goal</M>
      <Row style={{flexWrap:'wrap'}}>{Object.keys(GOALS).map(k=><Chip key={k} t={GOALS[k]} on={f.goal===k} onPress={()=>set('goal',k)}/>)}</Row>
      {a>0&&a<18?<M style={{marginBottom:10}}>Under 18: you get a stay-the-same plan. Talk to a doctor before changing your diet.</M>:null}
      <Btn t="Create profile" onPress={save}/>
    </Card>
    <M style={{textAlign:'center'}}>Plans are general guidance, not medical advice.</M>
  </View>;
}

function Main(){
  const [db,setDb]=useState(null);
  const [tab,setTab]=useState('home');
  const [pm,setPm]=useState('');
  const [msgs,setMsgs]=useState([]);
  const [inp,setInp]=useState('');
  const [cf,setCf]=useState({n:'',k:'',p:''});
  const [man,setMan]=useState('');
  const sv=useRef(null);
  const ins=useSafeAreaInsets();
  const init={profiles:[],active:null,logs:{},remind:true};
  useEffect(()=>{AsyncStorage.getItem('df1').then(s=>setDb(s?JSON.parse(s):init)).catch(()=>setDb(init));},[]);
  const upd=fn=>setDb(d=>{const n=fn(JSON.parse(JSON.stringify(d)));AsyncStorage.setItem('df1',JSON.stringify(n));return n;});
  const on=!!db&&db.remind!==false;
  useEffect(()=>{if(db)sched(on);},[db===null,on]);
  const p=db&&(db.profiles.find(x=>x.id===db.active)||db.profiles[0]);
  const day=p?((db.logs[p.id]||{})[dk()]||E()):E();
  const setDay=fn=>upd(d=>{const l=(d.logs[p.id]=d.logs[p.id]||{});l[dk()]=fn(l[dk()]||E());return d;});
  const addSteps=n=>upd(d=>{
    const pr=d.profiles.find(x=>x.id===d.active);if(!pr)return d;
    const l=(d.logs[pr.id]=d.logs[pr.id]||{});const o=l[dk()]||E();const b=o.steps;o.steps+=n;l[dk()]=o;
    const g=pr.goal2||8000;
    if(b<g&&o.steps>=g)N.scheduleNotificationAsync({content:{title:'Step goal reached 🎉',body:pr.name+', you hit '+g+' steps today!'},trigger:{channelId:'default'}}).catch(()=>{});
    return d;
  });
  useEffect(()=>{
    let s,last=0;if(!p)return;
    (async()=>{try{
      if(!(await Pedometer.isAvailableAsync())){setPm('No step sensor found. Add steps by hand.');return;}
      const r=await Pedometer.requestPermissionsAsync();
      if(!r.granted){setPm('Allow physical activity access to count steps.');return;}
      setPm('Counting steps while the app is open.');
      s=Pedometer.watchStepCount(x=>{const d=x.steps-last;last=x.steps;if(d>0)addSteps(d);});
    }catch(e){setPm('Step sensor unavailable. Add steps by hand.');}})();
    return()=>{if(s)s.remove();};
  },[p&&p.id]);

  if(!db)return <G colors={BG} style={{flex:1}}/>;
  const shell=c=><G colors={BG} style={{flex:1,paddingTop:ins.top+6}}><StatusBar barStyle="light-content" backgroundColor="transparent" translucent/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>{c}</KeyboardAvoidingView></G>;
  const save=pr=>{upd(d=>{d.profiles.push(pr);d.active=pr.id;return d;});setTab('home');};
  if(!db.profiles.length)return shell(<ScrollView contentContainerStyle={{padding:16,paddingBottom:ins.bottom+24}} keyboardShouldPersistTaps="handled"><Row style={{marginBottom:14}}><Image source={require('./assets/icon.png')} style={{width:44,height:44,borderRadius:12,marginRight:10}}/><Text style={{color:C.tx,fontSize:24,fontWeight:'800'}}>Daily-Fit</Text></Row><Form first onSave={save}/></ScrollView>);

  const t=tg(p),fk=sum(day.food,'k'),fp=sum(day.food,'p'),goal=p.goal2||8000;
  const burn=Math.round(day.steps*p.weight*0.0005);
  const km=(day.steps*p.height*0.415/100000).toFixed(2);

  const coach=text=>{
    const tl=text.toLowerCase();let food=day.food,steps=day.steps,water=day.water;const n=[];
    const sm=tl.match(/steps?\D*(\d{2,6})|(\d{2,6})\s*steps?/);
    if(sm){steps=+(sm[1]||sm[2]);n.push('Steps set to '+steps+'.');}
    if(tl.includes('water')){const m=tl.match(/(\d+)/);water+=m?+m[1]:1;n.push('Water: '+water+' glasses.');}
    const it=parse(tl);
    if(it.length){food=food.concat(it);n.push('Logged: '+it.map(i=>i.name+' x'+i.q).join(', ')+'.');}
    setMsgs(m=>m.concat({me:1,text}));
    if(!n.length){setMsgs(m=>m.concat({text:'I did not catch that. Try "2 eggs and 1 roti", "300 kcal 20 g protein", "steps 4000" or "water 2".'}));return;}
    setDay(()=>({steps,water,food}));
    const k=sum(food,'k'),pr=sum(food,'p'),rk=t.kcal-k,rp=Math.max(0,t.protein-pr);
    n.push('Today: '+k+'/'+t.kcal+' kcal, '+pr+'/'+t.protein+' g protein.');
    n.push(rk>0?rk+' kcal and '+rp+' g protein left. '+suggest(rk):'You are '+(-rk)+' kcal over target. Take a walk and keep dinner light.');
    if(steps<goal)n.push((goal-steps)+' steps to go.');
    n.push('Anything else you ate? How many steps so far?');
    setMsgs(m=>m.concat({text:n.join(' ')}));
  };

  let body=null;
  if(tab==='home')body=<>
    <G colors={SUN} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:24,padding:20,marginBottom:12}}>
      <Text style={{color:'#ffffffcc',fontSize:14}}>Hi {p.name}, calories left today</Text>
      <Text style={{color:'#fff',fontSize:52,fontWeight:'800'}}>{Math.max(0,t.kcal-fk)}</Text>
      <Text style={{color:'#ffffffcc'}}>{fk} eaten of {t.kcal} kcal. Walking burnt {burn} kcal.</Text>
    </G>
    <Card>
      <Row style={{justifyContent:'space-between',marginBottom:6}}><Text style={{color:C.tx}}>Protein</Text><M>{fp} / {t.protein} g</M></Row>
      <Bar v={fp} max={t.protein} cols={['#ff8a5c','#f43f5e']}/>
      <Row style={{justifyContent:'space-between',marginTop:14,marginBottom:6}}><Text style={{color:C.tx}}>Steps</Text><M>{day.steps} / {goal}</M></Row>
      <Bar v={day.steps} max={goal} cols={['#2dd4bf','#6366f1']}/>
      <Row style={{justifyContent:'space-between',marginTop:14,marginBottom:6}}><Text style={{color:C.tx}}>Water</Text><M>{day.water} / {t.water} glasses</M></Row>
      <Bar v={day.water} max={t.water} cols={['#38bdf8','#6366f1']}/>
    </Card>
    <Card><H>Your diet plan</H>{plan(t).map(m=><View key={m.n} style={{marginBottom:10}}><Row style={{justifyContent:'space-between'}}><Text style={{color:C.tx,fontWeight:'600'}}>{m.n}</Text><M>{m.k} kcal, {m.p} g protein</M></Row><M>{m.i}</M></View>)}<M>General guidance, not medical advice.</M></Card>
    <Btn t="Ask the coach what to eat next" onPress={()=>setTab('coach')} cols={['#2dd4bf','#6366f1']}/>
  </>;
  if(tab==='food')body=<>
    <Card><H>Add food</H><Row style={{flexWrap:'wrap'}}>{FOODS.map(f=><Chip key={f.n} t={f.u} onPress={()=>setDay(o=>({...o,food:o.food.concat({name:f.n,q:1,k:f.k,p:f.p})}))}/>)}</Row>
      <M style={{marginVertical:8}}>Or add your own</M>
      <In placeholder="Food name" value={cf.n} onChangeText={v=>setCf({...cf,n:v})}/>
      <Row style={{gap:8}}><In style={{flex:1}} placeholder="kcal" keyboardType="numeric" value={cf.k} onChangeText={v=>setCf({...cf,k:v})}/><In style={{flex:1}} placeholder="Protein (g)" keyboardType="numeric" value={cf.p} onChangeText={v=>setCf({...cf,p:v})}/></Row>
      <Btn t="Add to today" onPress={()=>{if(!(+cf.k>0))return Alert.alert('Add calories','Enter the calories for this food.');setDay(o=>({...o,food:o.food.concat({name:cf.n.trim()||'custom',q:1,k:+cf.k,p:+cf.p||0})}));setCf({n:'',k:'',p:''});}}/></Card>
    <Card><H>Eaten today: {fk} kcal, {fp} g protein</H>{day.food.length?day.food.map((x,i)=><Row key={i} style={{justifyContent:'space-between',paddingVertical:6}}><Text style={{color:C.tx,flex:1}}>{x.name} x{x.q}</Text><M>{x.k} kcal, {x.p} g</M><T onPress={()=>setDay(o=>({...o,food:o.food.filter((_,j)=>j!==i)}))}><Text style={{color:C.a,marginLeft:12,fontSize:16}}>✕</Text></T></Row>):<M>Nothing logged yet. Tap a food above.</M>}</Card>
  </>;
  if(tab==='steps')body=<>
    <G colors={['#2dd4bf','#6366f1','#8b5cf6']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:24,padding:20,marginBottom:12}}>
      <Text style={{color:'#ffffffcc'}}>Steps today</Text><Text style={{color:'#fff',fontSize:52,fontWeight:'800'}}>{day.steps}</Text>
      <Text style={{color:'#ffffffcc'}}>{km} km walked, {burn} kcal burnt</Text>
    </G>
    <Card><Bar v={day.steps} max={goal} cols={['#2dd4bf','#6366f1']}/>
      <Row style={{justifyContent:'space-between',marginTop:12}}><M>Daily goal: {goal} steps</M><Row><Chip t="−500" onPress={()=>upd(d=>{const q=d.profiles.find(x=>x.id===p.id);q.goal2=Math.max(1000,goal-500);return d;})}/><Chip t="+500" onPress={()=>upd(d=>{const q=d.profiles.find(x=>x.id===p.id);q.goal2=goal+500;return d;})}/></Row></Row>
      <M>{pm}</M></Card>
    <Card><H>Add steps by hand</H><Row style={{gap:8}}><In style={{flex:1}} placeholder="Steps" keyboardType="numeric" value={man} onChangeText={setMan}/><Btn t="Add" onPress={()=>{if(+man>0){addSteps(+man);setMan('');}}}/></Row></Card>
  </>;
  if(tab==='water')body=<>
    <Card><H>Water: {day.water} of {t.water} glasses</H>
      <Row style={{flexWrap:'wrap',marginBottom:10}}>{Array.from({length:Math.max(t.water,day.water)}).map((_,i)=><Text key={i} style={{fontSize:30,margin:4,opacity:i<day.water?1:.25}}>💧</Text>)}</Row>
      <Bar v={day.water} max={t.water} cols={['#38bdf8','#6366f1']}/>
      <Row style={{gap:8,marginTop:14}}><Btn style={{flex:1}} t="Drank a glass" cols={['#38bdf8','#6366f1']} onPress={()=>setDay(o=>({...o,water:o.water+1}))}/><Btn t="−1" cols={['#2b2663','#2b2663']} onPress={()=>setDay(o=>({...o,water:Math.max(0,o.water-1)}))}/></Row></Card>
    <Card><H>Reminders</H><M style={{marginBottom:10}}>Water at 9 and 11 am, then 1, 3, 5, 7 and 9 pm, plus a walk nudge at 6:30 pm and a meal log nudge at 8:30 pm.</M><Chip t={on?'Reminders on':'Reminders off'} on={on} onPress={()=>upd(d=>{d.remind=!(d.remind!==false);return d;})}/></Card>
  </>;
  if(tab==='coach')body=<>
    <Card><H>Coach</H>
      {[{text:'Hi '+p.name+'! Tell me what you ate and how many steps you have taken. For example: "2 eggs and 1 roti" or "steps 4000". Your targets: '+t.kcal+' kcal and '+t.protein+' g protein.'}].concat(msgs).map((m,i)=><View key={i} style={{alignSelf:m.me?'flex-end':'flex-start',maxWidth:'88%',backgroundColor:m.me?'#4f46e5':'#0f0d2b',borderRadius:14,padding:10,marginBottom:8}}><Text style={{color:C.tx}}>{m.text}</Text></View>)}
      <Row style={{gap:8,marginTop:6}}><In style={{flex:1,marginBottom:0}} placeholder="What did you eat?" value={inp} onChangeText={setInp} onSubmitEditing={()=>{if(inp.trim()){coach(inp);setInp('');}}}/><Btn t="Send" onPress={()=>{if(inp.trim()){coach(inp);setInp('');}}}/></Row></Card>
  </>;
  if(tab==='profiles')body=<>
    {db.profiles.map(x=><Card key={x.id} style={{borderColor:x.id===p.id?C.b:C.line}}><Row style={{justifyContent:'space-between'}}><T onPress={()=>{upd(d=>{d.active=x.id;return d;});setTab('home');}} style={{flex:1}}><Text style={{color:C.tx,fontSize:16,fontWeight:'700'}}>{x.name}{x.id===p.id?'  (active)':''}</Text><M>{x.age} yrs, {x.height} cm, {x.weight} kg</M></T>
      <T onPress={()=>Alert.alert('Delete '+x.name+'?','This removes the profile and its logs.',[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>{upd(d=>{d.profiles=d.profiles.filter(y=>y.id!==x.id);delete d.logs[x.id];if(d.active===x.id)d.active=d.profiles[0]?d.profiles[0].id:null;return d;});setTab('home');}}])}><Text style={{color:C.a,fontSize:16}}>Delete</Text></T></Row></Card>)}
    <Btn t="Add another profile" onPress={()=>setTab('new')}/>
  </>;
  if(tab==='new')body=<Form onSave={save}/>;

  const tabs=[['home','🏠','Home'],['food','🍽','Food'],['steps','👟','Steps'],['water','💧','Water'],['coach','💬','Coach']];
  return shell(<>
    <Row style={{paddingHorizontal:16,paddingBottom:8,justifyContent:'space-between'}}>
      <Row><Image source={require('./assets/icon.png')} style={{width:36,height:36,borderRadius:10,marginRight:10}}/><Text style={{color:C.tx,fontSize:20,fontWeight:'800'}}>Daily-Fit</Text></Row>
      <T onPress={()=>setTab('profiles')} style={{backgroundColor:C.card,borderColor:C.line,borderWidth:1,borderRadius:20,paddingVertical:7,paddingHorizontal:14}}><Text style={{color:C.tx,fontWeight:'600'}}>{p.name} ▾</Text></T>
    </Row>
    <ScrollView ref={sv} contentContainerStyle={{padding:16,paddingBottom:24}} keyboardShouldPersistTaps="handled">{body}</ScrollView>
    <Row style={{backgroundColor:'#0d0b28',borderTopColor:C.line,borderTopWidth:1,paddingBottom:Math.max(ins.bottom,10)+4,paddingTop:8}}>
      {tabs.map(([k,i,l])=><T key={k} onPress={()=>setTab(k)} style={{flex:1,alignItems:'center'}}><Text style={{fontSize:22,opacity:tab===k?1:.5}}>{i}</Text><Text style={{color:tab===k?C.b:C.mu,fontSize:11,fontWeight:'600'}}>{l}</Text></T>)}
    </Row>
  </>);
}

export default function App(){return <SafeAreaProvider><Main/></SafeAreaProvider>;}
