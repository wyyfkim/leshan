import React, { Component } from 'react'
import {connect} from 'react-redux';
import QRCode from 'qrcode.react'
import { Link } from 'react-router-dom'
import { withGoogleMap, GoogleMap, Marker, Polyline } from "react-google-maps"
import DeviceManager, {getDefaultAccount } from '../deviceManagement/DeviceManager';

import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faInfoCircle from '@fortawesome/fontawesome-free-solid/faInfoCircle'
import faThumbtack from '@fortawesome/fontawesome-free-solid/faThumbtack'
import faWrench from '@fortawesome/fontawesome-free-solid/faWrench'
import faMapMarker from '@fortawesome/fontawesome-free-solid/faMapMarker'
import faCertificate from '@fortawesome/fontawesome-free-solid/faCertificate'
import faHistory from '@fortawesome/fontawesome-free-solid/faHistory'

import AnnotatedSection from '../components/AnnotatedSection'

import {
    Button,
    Table
} from 'reactstrap';
import {addHexPrefix} from "ethereumjs-util";

/*
  View component
  @description Page component that displays a product's information.
*/
class View extends Component {

    constructor(props) {
        super(props);

        // product information definition
        this.state = {
            name: "",
            description: "",
            latitude: "",
            longitude: "",
            versionCreationDate: "",
            versions: [],
            certifications: [],
            id: "",
            customDataJson: "",
            tempAlerts: [],
            locaAlerts: [],
            deviceClientName: ''
        };
    }

    // when initially loading the page, fetch the requested product
    componentDidMount(){
        this.fetchProduct(this.props);
        this.fectchDevice(this.props);
    }
    async fectchDevice(props) {
        let deviceManager = await DeviceManager;
        let result = await deviceManager.getDevicesByAppId(props.match.params.productId, { from: getDefaultAccount() });
        console.log(result)
        this.setState({
            deviceClientName: result
        })

    }


    // fetch a product from the blockchain by productId (optionally, a "versionId" of that product can be specified)
    fetchProduct(props){

        // get the requested product (at the requested version if specified, otherwise it gets the latest version)
        this.props.passageInstance.getProductById(String(props.match.params.productId).valueOf(), props.match.params.versionId ? String(props.match.params.versionId).valueOf() : "latest")
            .then((result) => {
                // console.log(this.props.passageInstance)
                this.props.passageInstance.getProductByIdExtra(String(props.match.params.productId).valueOf(), "latest").then((deviceInfo) => {
                        // once we have the product data, we update the component's state
                    this.setState({
                        name: result[0],
                        description: result[1],
                        latitude: parseFloat(result[2]),
                        longitude: parseFloat(result[3]),
                        versionCreationDate: new Date(result[4].c * 1000).toString(),
                        versions: [],
                        id: props.match.params.productId,
                        certifications: [],
                        tempAlerts: deviceInfo[1].split(";"),
                        locaAlerts: deviceInfo[2].split(";"),
                        // deviceClientName: deviceInfo[0]
                    })
                })
                // then, we get the product's versions list
                const versionsArray = result[5];
                // console.log("View.js printing versoinsArray...")
                // console.log(versionsArray)
                versionsArray.map((versionId) => {
                    this.props.passageInstance.getVersionLatLngById(String(versionId).valueOf())
                        .then((latLngResult) => {
                            const version = {
                                latitude: parseFloat(latLngResult[0]),
                                longitude: parseFloat(latLngResult[1]),
                                id: versionId,
                            }
                            // console.log(version)
                            this.setState({versions: [...this.state.versions, version]})
                        });
                    return false;
                });
            })
            .catch((error) => {
                // if something goes wrong when fetching the product, we just redirect
                // to the home page to prevent displaying false/wrong information
                return this.props.history.push('/');
            })

        // also, we fetch the product's custom data fields and
        // add it to the rest of the product's data (in the component state)
        this.props.passageInstance.getProductCustomDataById(String(props.match.params.productId).valueOf(), props.match.params.versionId ? String(props.match.params.versionId).valueOf() : "latest")
            .then((result) => {
                console.log(result)
                this.setState({
                    customDataJson: result
                })
            })
            .catch((error) => {
                // if something goes wrong when fetching the product, we just redirect
                // to the home page to prevent displaying false/wrong information
                return this.props.history.push('/');
            })
        // console.log(this.state)
        // console.log(this.state.versions)
    }



    render() {



        const tempAlertList = this.state.tempAlerts.map((alert) => {
            console.log(alert)
            console.log(typeof (alert))
            if (alert !=  undefined && alert.trim().length != 0) {
                return (
                    <li>{alert.trim()}</li>
                )
            }
        })
        const locaAlertList = this.state.locaAlerts.map((alert) => {
            console.log(alert)
            if (alert !=  undefined && alert.trim() != "") {
                return (
                    <li>{alert.trim()}</li>
                )
            }
        })

        const tempContent = function() {
            console.log(tempAlertList)
            if (tempAlertList != undefined && tempAlertList.length > 0 && tempAlertList[1] != undefined) {
                return (<AnnotatedSection
                    annotationContent={
                        <div>
                            <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faCertificate}/>
                            Temperature alert
                        </div>
                    }
                    panelContent={
                        <div>
                            <ul>
                                {tempAlertList}
                            </ul>
                        </div>
                    }
                />)
            }
        }
        const locaContent = function () {
            console.log("locaAlertList")
            console.log(locaAlertList)
            if (locaAlertList != undefined && locaAlertList.length > 0 && locaAlertList[1] != undefined) {
                return (<AnnotatedSection
                    annotationContent={
                        <div>
                            <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faCertificate}/>
                            Location alert
                        </div>
                    }
                    panelContent={
                        <div>
                            <ul>
                                {locaAlertList}
                            </ul>
                        </div>
                    }
                />)
            }
        }


        // this is the JSX of the versions list section of the page
        const versionsList = this.state.versions.map((version, index) => {
            return (
                <li key={index}>
                    <Link to={`/products/${this.props.match.params.productId}/versions/${version.id}`}>Version {index + 1}</Link>
                </li>
            )
        }).reverse()

        // this is the JSX of certifications list
        // const certificationsList = this.state.certifications.map((certification, index) => {
        //     return (
        //         <div style={{display:"inline-block", marginRight:"15px", width:"100px", height:"100px"}} key={index}>
        //             {certification.imageUrl ? <img style={{width:"100%"}} alt={"Product has certification " + certification.name} src={certification.imageUrl}/> : <div>{certification.name}</div>}
        //         </div>
        //     )
        // })

        // here's a bunch of stuff related to the Google Maps embed
        const currentLat = this.state.latitude;
        const currentLng = this.state.longitude;

        // array of map markers
        const markersJSX = this.state.versions.map((version, index) => {
            return (
                <Marker key={index} label={(index + 1).toString()} position={{ lat: version.latitude, lng: version.longitude }} />
            )
        })

        // array of the versions' positions
        const versionsLatLngs = this.state.versions.map((version, index) => {
            return { lat: version.latitude, lng: version.longitude }
        });

        // used to display a line between the various versions' position markers
        const polylineJSX = (
            <Polyline
                path={versionsLatLngs}
                geodesic
                options={{
                    strokeColor: 'red',
                    strokeOpacity: 0.5,
                    strokeWeight: 4
                }}
            />
        )

        // the actual map component, which contains the markers and the line
        const MyMapComponent = withGoogleMap((props) =>
            <GoogleMap
                defaultZoom={8}
                defaultCenter={{ lat: currentLat, lng: currentLng }}
            >
                <div>
                    {markersJSX}
                    {polylineJSX}
                </div>
            </GoogleMap>
        )

        // used to define the customData to display whether it's available in the state
        const customData = this.state.customDataJson ? JSON.parse(this.state.customDataJson) : {};




        // the actual JSX that we return is below
        return (
            <div>
                {/* Product definition section */}
                <AnnotatedSection
                    annotationContent={
                        <div>
                            <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faInfoCircle}/>
                            Application definition
                        </div>
                    }
                    panelContent={
                        <Table>
                            <tbody>
                            <tr>
                                <th scope="row">Name</th>
                                <td>{this.state.name}</td>
                            </tr>
                            <tr>
                                <th scope="row">Description</th>
                                <td>{this.state.description}</td>
                            </tr>
                            <tr>
                                <th scope="row">Last updated on</th>
                                <td>{this.state.versionCreationDate}</td>
                            </tr>
                            <tr>
                                <th scope="row">Connected device</th>
                                <td>{this.state.deviceClientName}</td>
                            </tr>
                            {
                                Object.keys(customData).map(key =>
                                    <tr key={key}>
                                        <th scope="row">{key}</th>
                                        <td>{customData[key]}</td>
                                    </tr>
                                )
                            }
                            </tbody>
                        </Table>
                    }
                />

                {/* QR code section */}
                <AnnotatedSection
                    annotationContent={
                        <div>
                            <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faThumbtack}/>
                            Tracking information
                        </div>
                    }
                    panelContent={
                        <div>
                            <QRCode value={this.props.match.params.productId}/>
                            <div>
                                Unique identifier
                                <pre>{this.state.id}</pre>
                            </div>
                        </div>
                    }
                />

                {/* Actions section */}
                <AnnotatedSection
                    annotationContent={
                        <div>
                            <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faWrench}/>
                            Action
                        </div>
                    }
                    panelContent={
                        <div>
                            { this.props.match.params.versionId && this.state.versions && this.state.versions.length > 0 && this.props.match.params.versionId.toString() !== this.state.versions.slice(-1)[0].id.toString() ?
                                <Link to={"/products/" + this.props.match.params.productId}>
                                    <Button color="info">
                                        View latest version
                                    </Button>
                                </Link>
                                :
                                <Link to={"/products/" + this.props.match.params.productId + "/update"}>
                                    <Button color="success">
                                        Update
                                    </Button>
                                </Link>
                            }
                            {/*<Link style={{marginLeft: "10px"}} to={"/products/" + this.props.match.params.productId + "/split"}>*/}
                            {/*  <Button color="warning">*/}
                            {/*    Split this product*/}
                            {/*  </Button>*/}
                            {/*</Link>*/}
                        </div>
                    }
                />

                {/* Google Maps section */}
                {/*<AnnotatedSection*/}
                {/*  annotationContent={*/}
                {/*    <div>*/}
                {/*      <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faMapMarker}/>*/}
                {/*      Location*/}
                {/*    </div>*/}
                {/*  }*/}
                {/*  panelContent={*/}
                {/*    <div>*/}
                {/*      {currentLat && currentLng ? */}
                {/*        <div>*/}
                {/*          <pre>{currentLat}, {currentLng}</pre>*/}
                {/*          <MyMapComponent*/}
                {/*            loadingElement={<div style={{ height: `100%` }} />}*/}
                {/*            containerElement={<div style={{ height: `400px` }} />}*/}
                {/*            mapElement={<div style={{ height: `100%` }} />}*/}
                {/*          />*/}
                {/*        </div>*/}
                {/*        :*/}
                {/*        <p>Unable to display the product's location.</p>*/}
                {/*      }*/}
                {/*    </div>*/}
                {/*  }*/}
                {/*/>*/}

                 {/*Alerts section*/}
                {tempContent()}
                {locaContent()}

                {/* Versions section */}
                <AnnotatedSection
                    annotationContent={
                        <div>
                            <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faHistory}/>
                            Version history
                        </div>
                    }
                    panelContent={
                        <div>
                            <ul>
                                {versionsList}
                            </ul>
                        </div>
                    }
                />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        passageInstance: state.reducer.passageInstance
    };
}


export default connect(mapStateToProps)(View);