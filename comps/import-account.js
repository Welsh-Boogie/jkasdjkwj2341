import Card from '@material-ui/core/Card'
import SwipeableViews from 'react-swipeable-views'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import TextField from '@material-ui/core/TextField'
import { UploadField } from '@navjobs/upload'
import Button from '@material-ui/core/Button'
import Snack from './snackbar'
import I18n from '../util/i18n'

import AccountCircleIcon from '@material-ui/icons/AccountCircle'

const log = console.log

class ImportAccount extends React.Component{

    constructor(props) {
        super(props)
        let { t } = props
        this.state = { 
            value:'privatekey',
            index:0,
            importWays:[
                {label:t.import_account_account_tab_label_privatekey,val:'privatekey'}, //label:私钥
                {label:t.import_account_account_tab_label_mnemonic,val:'mnemonic'},// label:助记词
                {label:t.import_account_account_tab_label_keystore,val:'keystore'},//label:keystore
            ],
            privatekey:'',
            showPrivatekeyBtn:false,
            mnemonic:'',
            showMnemonicBtn:false,
            keystore:'',
            keystorePwd:'',
            showKeystoreBtn:false,
            openSnack:false,
            message:'',
            messageType:'',
            windowInnerWidth:0,
            accountEthBalance:'0',
            accountTrueBalance:'0',            
            accountTtrBalance:'0',
            accountTruebetaBalance:0,
            isMounted:false,
        }
        // log(this)
        this.handleChange = this.handleChange.bind(this)
        this.handleChangeIndex = this.handleChangeIndex.bind(this)
        this.handlePrivatekeyInput = this.handlePrivatekeyInput.bind(this)
        this.privatekeyToAccount = this.privatekeyToAccount.bind(this)
        this.handleMnemonicInput = this.handleMnemonicInput.bind(this)
        this.mnemonicToAccount = this.mnemonicToAccount.bind(this)
        this.keystoreToAccount = this.keystoreToAccount.bind(this)
        this.handleKeystorePwdInput = this.handleKeystorePwdInput.bind(this)
        this.onKeystoreCome = this.onKeystoreCome.bind(this)
        this.onKeystoreDrop = this.onKeystoreDrop.bind(this)
        this.storeAccount = this.storeAccount.bind(this)
        this.updateDimensions = this.updateDimensions.bind(this)
        this.swipeableAction = this.swipeableAction.bind(this)
        this.showCurrentAccount = this.showCurrentAccount.bind(this)
        this.logOut = this.logOut.bind(this)
    }

    static getDerivedStateFromProps(props, state){        
        const { t } = props
        let importWays = state.importWays
        importWays.forEach(item=>{
            if(item.val=='privatekey'){ 
                item.label=t.import_account_account_tab_label_privatekey //label:私钥
            }
            if(item.val=='mnemonic'){
                item.label=t.import_account_account_tab_label_mnemonic // label:助记词
            }
            if(item.val=='keystore'){
                item.label=t.import_account_account_tab_label_keystore//label:keystore
            }
            if(item.val=='current-account'){
                item.label=t.import_account_account_tab_label_current_account //label:当前账户
            }
        })
        return {
            importWays
        }
    }

    // 更新窗口宽度状态
    updateDimensions() {
        this.setState({ windowInnerWidth: window.innerWidth })
    }
    componentDidMount() {
        let {t} = this.props
        this.setState({isMounted:true})
        window.addEventListener("resize", this.updateDimensions)
        this.timer = setTimeout( ()=>{
            this.updateDimensions()
            this.updateSwipeHeight()
            // 得到true web3智能合约对象
            eth_wallet_js.get_contract(
                '0xa4d17ab1ee0efdd23edc2869e7ba96b89eecf9ab',
                (r)=>{
                    if(this.state.isMounted){
                        this.setState(
                            {trueContract:r},
                            ()=>{ this.showCurrentAccount() }
                        )
                    }                    
            })
            // 得到ttr web3智能合约对象
            eth_wallet_js.get_contract(
                '0xf2bb016e8c9c8975654dcd62f318323a8a79d48e',
                (r)=>{
                    this.setState(
                        {ttrContract:r},
                        ()=>{ this.showCurrentAccount() }
                    )             
            })
        }, 200 )
        this.showCurrentAccount()     
    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions)
        clearTimeout(this.timer)
        this.setState({isMounted:false})
        this.setState = (state,callback)=>{
            return
        }
        
    }

    swipeableAction(e){
        this.updateSwipeHeight = e.updateHeight
        e.updateHeight()
    }

    // 存储账户信息到本地
    storeAccount(x){
        let storage = window.localStorage
        storage.setItem( 'account', JSON.stringify(x) )
        if(this.props.notify){ this.props.notify(x.address) }
    }

    // 显示当前账户
    showCurrentAccount(){
        const { t } = this.props
        let storage = window.localStorage     
        let account = JSON.parse( storage.getItem('account') )
        if(account){
            let importWays = this.state.importWays
            let alreadyGet = false
            importWays.forEach(item=>{ if(item.val=='current-account'){ alreadyGet = true } })
            if(!alreadyGet){ 
                this.state.importWays.unshift({label:t.import_account_account_tab_label_current_account,val:'current-account'})
            }  
            let accountState = {
                importWays:this.state.importWays,
                value:'current-account',
                index:0,
                account,
            }
            if(account.ether){ accountState.accountEthBalance = account.ether }
            if(account.trueToken){ accountState.accountTrueBalance = account.trueToken }
            if(account.ttrToken){ accountState.accountTtrBalance = account.ttrToken }
            if(account.truebeta){ accountState.accountTruebetaBalance = account.truebeta }
            this.setState(accountState)
            
            let query = {address:account.address}
            if(this.state.trueContract){ query.contract = this.state.trueContract }
            eth_wallet_js.get_balance(
                query,
                (r)=>{
                    if (this.state.isMounted) {
                        const { ether,token } = r  
                        let accountState = {accountEthBalance:ether}
                        if(token){ accountState.accountTrueBalance = token }                      
                        this.setState(accountState)
                        account.ether = ether
                        account.trueToken = token
                        storage.setItem( 'account', JSON.stringify(account) )
                    }                    
            })
            //如果有ttr 合约对象请求ttr余额
            if(this.state.ttrContract){
                eth_wallet_js.get_balance(
                    {
                        address:account.address,
                        contract:this.state.ttrContract
                    },
                    (r)=>{
                        if(r.token){ accountState.accountTtrBalance = r.token }                      
                        this.setState(accountState)
                        account.ttrToken = r.token
                        storage.setItem( 'account', JSON.stringify(account) )
                })
            }
            let web3 = eth_wallet_js.web3
            let useprotocol = window.location.protocol
            let truebeta = new Web3.modules.ETrue(useprotocol+'//www.truewallet.net/true-beta-node/');
            truebeta.getBalance(account.address)
            .then((res)=>{
                if(res){
                    accountState.accountTruebetaBalance = web3.utils.fromWei(res)
                    this.setState( accountState )
                }
            })
        }        
    }

    // 退出当前账户
    logOut(){
        let importWays = this.state.importWays.filter(item=>{
            if(item.val=='current-account'){ return false }
            else{ return true }
        })
        let accountState = {
            importWays:importWays,
            value:'privatekey',
            index:0,
        }
        this.setState(accountState)
        let storage = window.localStorage  
        storage.removeItem('account')
        if(this.props.notify){ this.props.notify('') }
    }

    // 处理tab页切换时
    handleChange = (event, value) => {
        this.state.importWays.forEach( (item,index)=>{
            if(item.val == value){
                this.setState({ index,value })
            }
        } )        
    }
    // 处理swiper tab页的滑动时
    handleChangeIndex = index => {
        let val = this.state.importWays[index].val
        this.setState({ value: val });
    }

    // 输入私钥时
    handlePrivatekeyInput(e){
        let val =  e.target.value
        if( (val.length==64) || (val.length==66) || (val=='0x01') ){
            this.setState({
                privatekey:val,
                showPrivatekeyBtn:true
            })
        }else{
            this.setState({ showPrivatekeyBtn:false,privatekey:val })
        }
    }

    // 私钥导入账户
    privatekeyToAccount(){
        let privatekey = this.state.privatekey
        eth_wallet_js.get_address_privatekey(
            'privatekey',privatekey,
            account=>{
                this.storeAccount(account)
                this.setState({message:'导入账户成功',openSnack:true,messageType:'success',privatekey:''})
                this.showCurrentAccount()
            }
        )
    }

    // 输入助记词时
    handleMnemonicInput(e){
        let val =  e.target.value.toString()
        let vals = val.split(' ').filter(item=>item)
        if( vals.length==12 ){
            this.setState({
                mnemonic:vals.join(' '),
                showMnemonicBtn:true
            })
        }else{
            this.setState({ showMnemonicBtn:false,mnemonic:val })
        }
    }
    // 助记词导入
    mnemonicToAccount(){
        let mnemonic = this.state.mnemonic
        let comp = this
        eth_wallet_js.get_address_privatekey(
            'mnemonic',mnemonic,
            account=>{ 
                log(account) 
                comp.storeAccount(account)
                comp.setState({message:'导入账户成功',openSnack:true,messageType:'success',mnemonic:''})
                comp.showCurrentAccount()
            }
        )
    }

    // keystore密码输入时
    handleKeystorePwdInput(e){
        let val = e.target.value
        if(!val){
            this.setState({ keystorePwd:'' })
        }else{
            this.setState({ keystorePwd:val })
        }
        
    }
    // 上传keystore文件时
    onKeystoreCome(files){
        var file = files[0]
        let comp = this
        let reader = new FileReader()
        reader.onload = function(e) {
            let text = reader.result;
            // log(text)
            comp.setState({ showKeystoreBtn:true,keystore:text,keystoreFileName:file.name })
        }
        log(file)
        reader.readAsText(file)        
    }
    onKeystoreDrop(f){
        let comp = this
        let reader = new FileReader()
        reader.onload = function(e) {
            let text = reader.result;
            // log(text)
            comp.setState({ showKeystoreBtn:true,keystore:text,keystoreFileName:f.name })
        }
        reader.readAsText(f) 
    }
    // keystore导入
    keystoreToAccount(){
        let comp = this
        let { keystore, keystorePwd } = this.state
        eth_wallet_js.get_address_privatekey(
            'keystore',
            { keystore,password:keystorePwd },
            res=>{ 
                log(res)
                if(!res.err){
                    comp.storeAccount(res)
                    comp.setState({message:'导入账户成功',openSnack:true,messageType:'success'})
                    comp.showCurrentAccount()
                }
                else{
                    comp.setState({message:'错误的密码或文件',openSnack:true,messageType:'error'})
                }
            }
        )
        
    }


    render(){
        const { state, props } = this
        const { t,setLang } = props
        let importWords = t.public_import_account_words
        let importantWidth = 'auto'
        if( state.windowInnerWidth < 660 ){
            importantWidth = (state.windowInnerWidth-70)+'px'
        }

        return (
            <div style={{flex:'auto',margin:'20px',maxWidth:'600px'}}>
                <Snack
                    message={state.message}
                    messageType={state.messageType}
                    status={state.openSnack}
                    closeSnack={ ()=>{ this.setState({openSnack:false}) }}
                />
                <Card raised={true}>
                    <div className="import-account" style={{ maxWidth:importantWidth }}>
                        <p className="import-account-title">
                            {/* 导入账户 */}
                            {t.import_account_title}
                        </p>
                        <p className="title">
                            {/* 你将怎样使用账户? */}
                            {t.import_account_how_use_title}
                        </p>
                        <AppBar position="static" color="default">
                            <Tabs
                                value={state.value}
                                onChange={this.handleChange}
                                indicatorColor="primary"
                                textColor="primary"
                                fullWidth
                            >
                            {   
                                state.importWays.map( item=>(
                                    <Tab key={item.val} value={item.val} label={item.label} />
                                ) )
                            }
                            </Tabs>
                        </AppBar>
                        <SwipeableViews
                            index={state.index}
                            onChangeIndex={this.handleChangeIndex}
                            action={this.swipeableAction}
                        >
                        {
                            state.importWays.map( item=>(
                                <div key={item.val} className={item.val}>
                                { 
                                    item.val =='current-account' &&
                                    <div>
                                        <AccountCircleIcon color="primary" style={{fontSize:'80px'}}></AccountCircleIcon>
                                        <p className="account-address">
                                            <span className="meta-text" >
                                                {/* 账户地址： */}
                                                {t.import_account_account_addres_label}:
                                            </span>
                                            <span className="primary-text" >{state.account.address}</span>
                                        </p>
                                        <p className="balance">
                                            <span className="meta-text">{t.eth_balance}：</span>
                                            <span className="primary-text">{state.accountEthBalance}</span>
                                            <span className="meta-text">
                                                {/* True余额： */}
                                                {t.true_balance}
                                            </span>
                                            <span className="primary-text">{state.accountTrueBalance}</span>
                                            <span className="meta-text">
                                                {/* TTR余额： */}
                                                {t.ttr_balance}
                                            </span>
                                            <span className="primary-text">{state.accountTtrBalance}</span>
                                            <span className="meta-text">
                                                {/* TRUe： */}
                                                True beta:
                                            </span>
                                            <span className="primary-text">{state.accountTruebetaBalance}</span>
                                        </p>
                                        <Button 
                                            variant="contained" 
                                            color="primary"
                                            fullWidth={true}
                                            style={{color:'#fff',margin:'25px 0px'}}
                                            onClick={this.logOut}
                                        >
                                            {/* 退出当前账户 */}
                                            {t.import_account_account_exit_current_account}
                                        </Button>
                                    </div>
                                }
                                {
                                    item.val == 'privatekey' &&
                                    <div style={{width:'100%'}}>
                                    <TextField 
                                        placeholder={t.public_privatekey_words} 
                                        // 私钥内容
                                        fullWidth={true}
                                        type="text"
                                        onChange={this.handlePrivatekeyInput}
                                        style={{margin:'35px 0px'}}
                                        value={state.privatekey}
                                    />
                                    {
                                        state.showPrivatekeyBtn &&
                                        <Button 
                                            variant="contained" 
                                            color="primary"
                                            fullWidth={true}
                                            style={{color:'#fff',margin:'25px 0px'}}
                                            onClick={this.privatekeyToAccount}
                                        >
                                            {/* 导入账户 */}
                                            {importWords}
                                        </Button>
                                    }                                    
                                    </div>
                                }
                                {
                                    item.val == 'mnemonic' &&
                                    <div style={{width:'100%'}}>
                                    <TextField 
                                        placeholder={t.public_mnemonic_words}
                                        // {'助记词(12个字符)'} 
                                        fullWidth={true}
                                        type="text"
                                        onChange={this.handleMnemonicInput }
                                        style={{margin:'35px 0px'}}
                                        value={state.mnemonic}
                                        multiline={true}
                                    />
                                    {
                                        state.showMnemonicBtn &&
                                        <Button 
                                            variant="contained" 
                                            color="primary"
                                            fullWidth={true}
                                            style={{color:'#fff',margin:'25px 0px'}}
                                            onClick={this.mnemonicToAccount}
                                        >
                                            {/* 导入账户 */}
                                            {importWords}
                                        </Button>
                                    }
                                    </div>
                                }
                                {
                                    item.val == 'keystore' &&
                                    <div style={{margin:'35px 0px 0px'}}>
                                    <UploadField
                                        onFiles={ this.onKeystoreCome }
                                        containerProps={{className: 'resume_import'}}
                                        uploadProps={{
                                            accept: '*/*',
                                        }}
                                    >
                                        <div className="uploader" onDrop={this.onKeystoreDrop}>
                                            {
                                                state.keystoreFileName &&
                                                <p>{state.keystoreFileName}</p>
                                            }
                                            <p>
                                                {/* 点击选择keystore文件 */}
                                                {t.import_account_account_select_keystore_tip1}
                                            </p>
                                            <p>
                                                {/* 或者拖拽keystore文件到这里 */}
                                                {t.import_account_account_select_keystore_tip2}
                                            </p>
                                        </div>
                                    </UploadField>
                                    <TextField 
                                        placeholder={t.public_optional_pwd}
                                        // {'之前设置的密码（未设置过则不用填）'} 
                                        fullWidth={true}
                                        type="password"
                                        onChange={this.handleKeystorePwdInput }
                                        style={{margin:'35px 0px'}}
                                    />
                                    {
                                        state.showKeystoreBtn &&
                                        <Button 
                                            variant="contained" 
                                            color="primary"
                                            fullWidth={true}
                                            style={{color:'#fff',margin:'25px 0px'}}
                                            onClick={this.keystoreToAccount}
                                        >
                                            {/* 导入账户 */}
                                            {importWords}
                                        </Button>
                                    }
                                    </div> 
                                }
                                </div>
                            ) )
                        }
                        </SwipeableViews>
                    </div>            
                </Card>
                <style jsx>{`
                    .import-account {
                        min-width:230px;
                        padding:20px;
                        flex:auto;
                        word-break:break-all;
                    }
                    .import-account-title {
                        color:#324057;
                    }
                    .title {
                        color:rgba(0, 0, 0, 0.54);
                        font-size:18px;
                    }
                    .resume_import {
                        margin-top:35px 0px;
                    }
                    .uploader {
                        border: 3px dashed #C7C7C7;
                        padding: 20px;
                        border-radius:8px;
                        background-color:#EFF2F7;
                        text-align:center;
                        color:#324057;
                    }
                    .current-account {
                        display:flex;
                        flex-direction:column;
                        justify-content:center;
                        align-items:center;
                        padding:20px;
                        text-align:center;
                    }
                    .account-address {
                        text-align:center;
                        color:#00acc1;
                        font-size:14px;
                        line-height:20px;
                    }
                    .meta-text {
                        margin: 0px 10px;
                        color:#324057;
                    }
                    .primary-text {
                        color:#00acc1;
                    }
                `}</style>
            </div>
        )
    }
}

export default I18n(ImportAccount)