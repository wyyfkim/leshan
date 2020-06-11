import React, { Component } from 'react'
import {connect} from 'react-redux';
import { Link } from 'react-router-dom'

import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faSearch from '@fortawesome/fontawesome-free-solid/faSearch'
import faList from '@fortawesome/fontawesome-free-solid/faList'
import faGroup from '@fortawesome/fontawesome-free-solid/faObjectGroup'

import AnnotatedSection from '../components/AnnotatedSection'

import UpdateGodUser from '../components/UpdateGodUser';
import faUser from '@fortawesome/fontawesome-free-solid/faUser'
import Search from '../components/Search';
import {Button} from "reactstrap";
import deviceABI from '../deviceManagement/artifacts/DeviceManager.json'
class MyProducts extends Component {

  constructor(props) {
    super(props);

    this.state = {
      products: [],
        smartContract: ""
    };
      props.web3.eth.getBalance(props.web3Accounts[0], function (err, result) {
          document.getElementById("EtherBalance").innerHTML = props.web3.fromWei(result, 'ether');
      });

  }

  redirect = () => {
      window.location.href = 'http://localhost:3001';
      // maybe can add spinner while loading
      return null;
  }
    getAddress() {
       return deviceABI.networks["1591383745483"].address
    }

  componentDidMount() {
      var deviceAddress = deviceABI.networks["1591383745483"].address
      var appAddress = this.props.passageInstance.address

    this.props.passageInstance.getOwnerProducts({ from: this.props.web3Accounts[0] })
      .then((result) => {
        result.map((productId) => {
          this.props.passageInstance.getProductById(String(productId).valueOf(), "latest")
            .then((result) => {
                this.props.passageInstance.getProductByIdExtra(String(productId).valueOf(), "latest")
                    .then((savedName) => {
                        console.log("MyProduct.js printing retrieved data from getProductByIdExtra..")
                        console.log(savedName)
                        this.props.passageInstance.getProductByDeviceClientName(String(savedName[0]).valueOf()).then((id) => {
                            console.log("MyProduct.js printing retrieved id from getProductByDeviceClientName (id, TAlert, LAlert)..")
                            console.log(id)
                            const product = {
                                name: result[0],
                                description: result[1],
                                latitude: parseFloat(result[2]),
                                longitude: parseFloat(result[3]),
                                versionCreationDate: Date(result[4]),
                                versions: result[5],
                                id: productId,
                                deviceClientName: id[0]}
                            this.setState({products: [...this.state.products, product]})
                        })
                        // const product = {
                        //     name: result[0],
                        //     description: result[1],
                        //     latitude: parseFloat(result[2]),
                        //     longitude: parseFloat(result[3]),
                        //     versionCreationDate: Date(result[4]),
                        //     versions: result[5],
                        //     id: productId,
                        //     deviceClientName: savedName}
                        // this.setState({products: [...this.state.products, product]})
                    })
            }).catch((error) => {console.log(error);})
          return false;
        })
      });
  }

  render() {
    const products = this.state.products.map((product, index) => {
      return (
        <Link key={index} to={`/products/${product.id}`}>
          <div key={index}>
            <b>{product.name || "Untitled product"}</b> &mdash; {product.description || "No description"}
            <hr/>
          </div>
        </Link>
      )
    })

    return (
      <div>
        {/*<AnnotatedSection*/}
        {/*  annotationContent={*/}
        {/*    <div>*/}
        {/*      <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faSearch}/>*/}
        {/*      View a product*/}
        {/*    </div>*/}
        {/*  }*/}
        {/*  panelContent={*/}
        {/*    <div>*/}
        {/*      <Search/>*/}
        {/*    </div>*/}
        {/*  }*/}
        {/*/>*/}
        <AnnotatedSection
          annotationContent={
            <div>
              <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faList}/>
              My applications
              <Link style={{marginLeft: "10px"}} to="/create">Create +</Link>
            </div>
          }
          panelContent={
            <div>
              {products && products.length > 0 ? products : 
              <div>
                You did not create an application yet.
                <Link style={{marginLeft: "10px"}} to="/create">Create a application</Link>
              </div>}
            </div>
          }
        />

          <AnnotatedSection
            annotationContent={
              <div>
                <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faGroup}/>
                IoT device management
              </div>
            }
            panelContent={
              <div>
                <div>
                    <Link color="primary" to="/register-device">Register a new device</Link>
                </div>
                  <div>
                      <Link color="primary" to="/manage-devices">Manage devices</Link>
                      {/*<Button style={{marginLeft: "10px"}} onClick={this.redirect}></Button>*/}
                  </div>
              </div>
            }
          />

          <AnnotatedSection
              annotationContent={
                  <div>
                      <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faUser}/>
                      Account information
                  </div>
              }
              panelContent={
                  <div>
                      <div>Ethereum account : {this.props.web3Accounts[0]}</div>
                      <div>Ether balance : <span id="EtherBalance"></span></div>
                      <div>ApplicationManagement contract address : {this.props.passageInstance.address}</div>
                      <div>Application contract address : {this.getAddress()}</div>
                  </div>
              }
          />
        {/*<AnnotatedSection*/}
        {/*  annotationContent={*/}
        {/*    <div>*/}
        {/*      <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faGroup}/>*/}
        {/*      Combine products*/}
        {/*    </div>*/}
        {/*  }*/}
        {/*  panelContent={*/}
        {/*    <div>*/}
        {/*      <div>*/}
        {/*        <Link style={{marginLeft: "10px"}} to="/combineList">List mode</Link>*/}
        {/*      </div>*/}
        {/*      <div>*/}
        {/*        <Link style={{marginLeft: "10px"}} to="/combineScan">QR scan mode</Link>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  }*/}
        {/*/>*/}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    passageInstance: state.reducer.passageInstance,
    productIdToView: state.reducer.productIdToView,
    web3Accounts: state.reducer.web3Accounts,
    web3: state.reducer.web3
  };
}

export default connect(mapStateToProps)(MyProducts);
