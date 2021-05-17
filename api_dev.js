var express=require('express');
var app=express();
var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR=' mongodb://127.0.0.1:27017';

//返回结果对象
var _callbackRusult={Msg:'',Code:'',Result:null};
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Method", "*");
    res.header("Access-Control-Allow-Headers","Content-Type");
    res.header("Access-Control-Max-Age", "3600");
    next();
});

var _valObj={
    arrs:[{
        id:'n1',
        name:'a_name',
        vals:'aaa'
    },{
        id:'n2',
        name:'b_name',
        vals:'bbb'
    },{
        id:'n3',
        name:'c_name',
        vals:'ccc'
    }]
};
let _filterResult=null;
//过滤方法
function filter(_val){
    return _valObj.arrs.filter(_g=>{
        return _g.vals===_val
    });
}
app.get('/node_a',function(req,res){
    let _txtVal = req.query.txtVal;
    let _result = filter(_txtVal);
    _filterResult = _result.length!==0?_result:_result=[{id:'xx',name:'没有结果'}];
    res.end();
});
app.get('/node_b',function(req,res){
    res.send(_filterResult);
    res.end();
});
//注册
app.post('/register_post',function(req,res){
    let _allData='';
    req.on('data',function(_d){
        _allData+=_d;
    });
    req.on('end',function(){
        // console.log(_allData);
        let _userObj=JSON.parse(_allData);
        MongoClient.connect(DB_CONN_STR,function(err,db){
            let _dbo = db.db('MyShoppingMall');  
            let _collection=_dbo.collection('userInfo');
            _collection.insertOne(_userObj,function(err,result){
                if(err) throw err;
                res.send({
                    _callbackRusult:{Msg:'注册成功',Code:'1',Result:null}
                });
                res.end();
                db.close();
            });
        });
    });
});
//校验前端用户名
app.post('/check_name_existence',function(req,res){
    let _nameObj='';
    req.on('data',function(_d){
        _nameObj+=_d;
    });
    req.on('end',function(){
        MongoClient.connect(DB_CONN_STR,function(err,db){
            let _dbo = db.db('MyShoppingMall');  
            let _collection=_dbo.collection('userInfo');
            _collection.findOne(JSON.parse(_nameObj),function(err,result){
                if(err) throw err;
                // console.log(result);
                if (result!==null) {
                    res.send({
                        _callbackRusult:{Msg:'用户名已存在',Code:'1',Result:null}
                    });
                    res.end();
                    db.close();
                }
            });
        });
    });
}) 
// 登录
app.post('/user_login_post',function(req,res){
    let _loginObj='';
    req.on('data',function(_d){
        _loginObj+=_d;
    });
    req.on('end',function(){
        MongoClient.connect(DB_CONN_STR,function(err,db){
            let _dbo=db.db('MyShoppingMall');
            let _collection=_dbo.collection('userInfo');
            _collection.findOne({"username":JSON.parse(_loginObj).username},function(err,result){
                if (result===null) {
                    res.send({
                        _callbackRusult:{
                            Msg:'用户名不存在',
                            Code:'-1',
                            Result:null
                        }
                    });
                    res.end();
                }else if(result.password!==JSON.parse(_loginObj).password){
                    res.send({
                        _callbackRusult:{
                            Msg:'密码错误',
                            Code:'-2',
                            Result:null
                        }
                    });
                    res.end();
                }else if (result!==null&&result.password===JSON.parse(_loginObj).password) {
                    res.send({
                        _callbackRusult:{
                            Msg:'登录成功',
                            Code:'1',
                            Result:result
                        }
                    });
                    res.end();
                }
                db.close();
            });
        });
    });
});
app.listen(4567,function(){
    console.log('4567,中间件启动');
})