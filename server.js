const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs'); //importing 'bcrypt-nodejs' , its a package that 'hashes' the passwords and compares them
const knex  = require('knex'); //importing 'knex' , its a package to connect the server with the 'database'

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'adimmanob@123',
      database : 'smartbrain'
    }
  });

  db.select('*').from('users'); // a query  

const app = express();

app.use(express.json()); //middleware to parse the body parameters that are in json
app.use(cors());


const database={
    users:[
        {
            id:123,
            email:'john@gmail.com',
            password:'cookies',
            entries:0,
            date:new Date(),
            name:'john'
        },
        {
            id:1234,
            email:'tanay@gmail.com',
            password:'tanay',
            entries:0,
            date:new Date(),
            name:'tanay'
        }

    ]
};


//********************creating signin endpoint ***********************************/
app.post('/signin',(req,res)=>{
  const {email,password} = req.body;

  db.select('email','hash').from('login').where('email','=',email)
                                            .then((data)=>{
                                                const isValid = bcrypt.compareSync(password, data[0].hash);
                                                console.log(isValid);
                                                if(isValid){
                                                  return db.select('*')
                                                           .from('users')
                                                           .where('email','=',data[0].email)
                                                           .then((response)=>res.json(response[0]))
                                                           .catch((err)=>res.status.json('unable to get user'))
                                                }else{
                                                    res.status(400).json('wrong credentials');
                                                }
                                            })
                                            .catch((err)=>res.status(400).json('wrong credentials'))
});

//**************************creating register endpoint ********************************* */

app.post('/register',(req,res)=>{
    const {email,password,name} = req.body; //destructuring

    const hash = bcrypt.hashSync(password); // 'hashing' the password 

    console.log('hash',hash);

    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then((loginEmail)=>{
            return trx('users').returning('*').insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
            })
            .then((data)=>res.json(data[0]))
        })
    
     
    .then(trx.commit)
    .catch(trx.rollback)
    })


  
   .catch((err)=>res.status(400).json('unable to register'))

});

//******************************** creating profile id endpoint **************************** */

app.get('/profile/:id',(req,res)=>{

    const { id } = req.params; //destructuring

    console.log(typeof(id));// prob is HERE.

    
   
    db.select('*').from('users').where({id:id})
                                     .then((user)=>{
                                         if(user.length>0){
                                             res.json(user[0])
                                         }else{
                                             res.status(400).json('Not found')
                                         }
                                     })
                                     .catch((err)=>res.status(400).json('error occurred'))
    


});

//********************************* creating endpoint for incrementing/updating the value of 'entries' on submitting images ********************************************* */
app.put('/image',(req,res)=>{
  const { id } = req.body;

  console.log(typeof(id));

  db('users').where('id','=',id).increment('entries',1).returning('entries')
                                        .then((data)=>{
                                            console.log(data)
                                            if(data.length>0){
                                                res.json(data)
                                            }else{
                                                res.status(400).json('error occurred') 
                                            }
                                           
                                        })
                                        .catch((err)=>res.status(400).json('error occurred'))

   

});

//########################## creating 'home' endpoint ##########################

app.get('/',(req,res)=>{
   
    res.json(database.users);
})


app.listen(3001);