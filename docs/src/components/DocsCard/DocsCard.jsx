import React, { useEffect, useState } from 'react'
import styles from './DocsCard.css'

export const DocsCard = ({ label, imgSrc, link, height = 40, width = 40, title }) => {
    console.log(title);
    const kubernetesSvg = '/img/setup/icons/kubernetes.svg'

    const imagePath = imgSrc.includes('kubernetes') ? kubernetesSvg : `/img/setup/icons/${imgSrc}.svg`

    const description = {
        "Try ToolJet": "Try out ToolJet with single docker command",
        DigitalOcean: "Quickly deploy ToolJet using the Deploy to DigitalOcean button",
        Docker: "Deploy ToolJet on a server using docker-compose",
        Heroku: "Deploy ToolJet on Heroku using the one-click-deployment button",
        "AWS EC2": "Deploy ToolJet on AWS EC2 instances",
        "AWS ECS": "Deploy ToolJet on AWS ECS instances",
        Openshift: "Deploy ToolJet on Openshift",
        Kubernetes: "Deploy ToolJet on a Kubernetes cluster",
        "Kubernetes (GKE)": "Deploy ToolJet on a GKE Kubernetes cluster",
        "Kubernetes (AKS)": "Deploy ToolJet on a AKS Kubernetes cluster",
        "Azure container apps": "Deploy ToolJet on a Azure Container Apps",
        "Google Cloud Run": "Deploy ToolJet on Cloud Run with GCloud CLI",
        "Deploying ToolJet client": "Deploy ToolJet Client on static website hosting services",
        "Environment variables": "Environment variables required by ToolJet Client and Server to start running",
        "Connecting via HTTP proxy": "Environment variables required by ToolJet to connect via HTTP proxy",
        "Deploying ToolJet on a subpath": "Steps to deploy ToolJet on a subpath rather than root of domain",
        "V2 migration guide": "Things to know before migrating to ToolJet V2",
    }

    return (

        <a href={link} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card-body">
                <div className="card-icon">
                    <img className='img' src={imagePath} width="100%" />
                </div>
                <div className="card-info">
                    <h3 style={{ margin: "0", paddingBottom: "0.5rem" }}>{label}</h3>
                    <p>
                        {description[label]}
                    </p>
                </div>
            </div>
        </a>
    )
}

