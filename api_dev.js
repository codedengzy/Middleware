var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = ' mongodb://127.0.0.1:27017';

//返回结果对象 1 -成功 -1 -失败 
var _callbackResult = { Msg: '', Code: '', Result: null };
//设置跨域访问
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Method", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Max-Age", "3600");
    next();
});

var _valObj = {
    arrs: [{
        id: 'n1',
        name: 'a_name',
        vals: 'aaa'
    }, {
        id: 'n2',
        name: 'b_name',
        vals: 'bbb'
    }, {
        id: 'n3',
        name: 'c_name',
        vals: 'ccc'
    }]
};
let _filterResult = null;
//过滤方法
function filter(_val) {
    return _valObj.arrs.filter(_g => {
        return _g.vals === _val
    });
}
app.get('/node_a', function (req, res) {
    let _txtVal = req.query.txtVal;
    let _result = filter(_txtVal);
    _filterResult = _result.length !== 0 ? _result : _result = [{ id: 'xx', name: '没有结果' }];
    res.end();
});
app.get('/node_b', function (req, res) {
    res.send(_filterResult);
    res.end();
});
//注册
app.post('/register_post', function (req, res) {
    let _allData = '';
    req.on('data', function (_d) {
        _allData += _d;
    });
    req.on('end', function () {
        // console.log(_allData);
        let _userObj = JSON.parse(_allData);
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            let _dbo = db.db('MyShoppingMall');
            let _collection = _dbo.collection('userInfo');
            _collection.insertOne(_userObj, function (err, result) {
                if (err) throw err;
                res.send({
                    _callbackResult: { Msg: '注册成功', Code: '1', Result: null }
                });
                res.end();
                db.close();
            });
        });
    });
});
//校验前端用户名
app.post('/check_name_existence', function (req, res) {
    let _nameObj = '';
    req.on('data', function (_d) {
        _nameObj += _d;
    });
    req.on('end', function () {
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            let _dbo = db.db('MyShoppingMall');
            let _collection = _dbo.collection('userInfo');
            _collection.findOne(JSON.parse(_nameObj), function (err, result) {
                if (err) throw err;
                // console.log(result);
                if (result !== null) {
                    res.send({
                        _callbackResult: { Msg: '用户名已存在', Code: '1', Result: null }
                    });
                    res.end();
                    db.close();
                }
            });
        });
    });
})
// 登录
app.post('/user_login_post', function (req, res) {
    let _loginObj = '';
    req.on('data', function (_d) {
        _loginObj += _d;
    });
    req.on('end', function () {
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            let _dbo = db.db('MyShoppingMall');
            let _collection = _dbo.collection('userInfo');
            _collection.findOne({ "username": JSON.parse(_loginObj).username }, function (err, result) {
                if (result === null) {
                    res.send({
                        _callbackResult: {
                            Msg: '用户名不存在',
                            Code: '-1',
                            Result: null
                        }
                    });
                    res.end();
                } else if (result.password !== JSON.parse(_loginObj).password) {
                    res.send({
                        _callbackResult: {
                            Msg: '密码错误',
                            Code: '-2',
                            Result: null
                        }
                    });
                    res.end();
                } else if (result !== null && result.password === JSON.parse(_loginObj).password) {
                    res.send({
                        _callbackResult: {
                            Msg: '登录成功',
                            Code: '1',
                            Result: result
                        }
                    });
                    res.end();
                }
                db.close();
            });
        });
    });
});
//批量插入商品分类
app.post('/insert_Goods', function (req, res) {
    var _dataObj = '';
    req.on('data', function (_d) {
        _dataObj += _d;
    });
    req.on('end', function () {
        let _insertGoodsArrs = JSON.parse(_dataObj);
        //    console.log(_insertGoodsArrs); 
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            let _dbo = db.db('MyShoppingMall');
            let _collection = _dbo.collection('goodsCategory');
            _collection.insertMany(_insertGoodsArrs, function (err, result) {
                if (err) throw err;
                if (result !== null) {
                    res.send({
                        _callbackResult: {
                            Msg: '商品录入成功',
                            Code: '1',
                            Result: result
                        }
                    });
                    res.end();
                }
                db.close();
            });
        });
    });

});
//获取商品和分类
app.get('/get_GoodsCategory', function (req, res) {
    MongoClient.connect(DB_CONN_STR, function (err, db) {
        let _dbo = db.db('MyShoppingMall');
        let _collection = _dbo.collection('goodsCategory');
        _collection.aggregate([{
            $lookup: {
                localField: 'd',
                from: 'goodsList_a',
                foreignField: 'category',
                as: 'goodsList_aa'
            }
        }, {
            $lookup: {
                localField: 'd',
                from: 'goodsList_b',
                foreignField: 'category',
                as: 'goodsList_bb'
            }
        }, {
            $lookup: {
                localField: 'd',
                from: 'goodsList_c',
                foreignField: 'category',
                as: 'goodsList_cc'
            }
        }, {
            $lookup: {
                localField: 'd',
                from: 'goodsList_d',
                foreignField: 'category',
                as: 'goodsList_dd'
            }
        }]).toArray(function (err, result) {
            if (err) throw err;
            res.send(result);
            res.end();
            db.close();
        });
    });
});
// 根据id获取商品详情
app.get('/get_GoodsInfoById', function (req, res) {
    // 引入ObjectID
    const ObjectID = require('mongodb').ObjectID;
    let _findId = ObjectID.createFromHexString(req.query._goodsId);
    let _findCategory = req.query._goodsCategory;
    MongoClient.connect(DB_CONN_STR, function (err, db) {
        let _dbo = db.db("MyShoppingMall");
        let _collection = _dbo.collection(_findCategory);
        _collection.findOne({ "_id": _findId }, {}, function (err, result) {
            if (err) throw err;
            res.send(result);
            db.close();
        })
    });
});
// 根据商品类别查找商品
app.get('/get_GoodsListByCategory', function (req, res) {
    let _c = req.query._category;
    MongoClient.connect(DB_CONN_STR, function (err, db) {
        let _dbo = db.db('MyShoppingMall');
        let _collection = _dbo.collection(_c);
        _collection.find().toArray(function (err, result) {
            if (err) {
                throw err;
            }
            res.send(result);
            db.close();
        });
    })
});
// 获取商品分页数据
app.get('/get_PageGoodsList',function (req,res) {
    let _limit=Number(req.query._limit);//每页条数
    let _startNum=Number(req.query._startNum);//开始记录数
    let _c=req.query._c;
    MongoClient.connect(DB_CONN_STR,function (err,db) {
        let _dbo=db.db('MyShoppingMall');
        let _collection=_dbo.collection(_c);
        _collection.find().limit(_limit).skip(_startNum).toArray(function(err,result) {
            if(err) throw err;
            res.send(result);
            db.close();
        });
        
    });
});
// 轮播图片
app.get('/get_SwipeImages',function (req,res) {
    let imgObj = {
		urls:[
                'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fattach.bbs.miui.com%2Fforum%2F201301%2F05%2F163809wo066osj41x6xwo2.jpg&refer=http%3A%2F%2Fattach.bbs.miui.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1628646820&t=7ad23c0bc9b6b250114260a38dcedfa3',
                'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fwww.bbra.cn%2F%28S%28xcudndznli4b00m1zbxktzjh%29%29%2FUploadfiles%2Fimgs%2F2014%2F02%2F07%2Ffeng4%2FXbzs_016.jpg&refer=http%3A%2F%2Fwww.bbra.cn&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1628646820&t=ac8bb2f9594744191c9d38cf61a4eea8',
                'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fpic.jj20.com%2Fup%2Fallimg%2F1114%2F0FR0104017%2F200FQ04017-6-1200.jpg&refer=http%3A%2F%2Fpic.jj20.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1628646820&t=579e59f6c2aece4b57f42863a12cc6e1',
                'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fattach.bbs.miui.com%2Fforum%2F201303%2F16%2F173710lvx470i4348z6i6z.jpg&refer=http%3A%2F%2Fattach.bbs.miui.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1628646820&t=cc7829c60b0a41c6c56045885bfc696c'
            ]
	}
	return res.send( imgObj );
    
})
//批量插入商品到数据库里，只运行一次
function insetTempGoodsList() {
    let _goodsListObj = [{
        name: 'GUCCI', price: 22, category: 'goodsList_d', img: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1548499978550&di=1f1fd228cf709228fca93dcafabbf02e&imgtype=0&src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201510%2F24%2F20151024113616_BvLPT.jpeg'
    }, {
        name: 'MK', price: 33, category: 'goodsList_d', img: 'https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=648227110,1457501216&fm=26&gp=0.jpg'
    }, {
        name: '巴宝莉', price: 44, category: 'goodsList_d', img: 'https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=6777935,920341325&fm=26&gp=0.jpg'
    }, {
        name: '香奈儿', price: 55, category: 'goodsList_d', img: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1548499789767&di=b4f2a12515147480cf44c7a2f7c68e78&imgtype=0&src=http%3A%2F%2Fimg.book118.com%2Fsr1%2FM00%2F28%2F31%2FwKh2AlveM9iIKYlgAB0cz4zZFTwAAP7GwG_jcwAHRzn525.jpg'
    }];
    MongoClient.connect(DB_CONN_STR, function (err, db) {
        let _dbo = db.db('MyShoppingMall');
        let _collection = _dbo.collection('goodsList_d');
        _collection.insertMany(_goodsListObj, function (err, result) {
            if (err) throw err;
            db.close();
        });
    });
}
// insetTempGoodsList();
app.listen(4567, function () {
    console.log('4567,中间件启动');
})
