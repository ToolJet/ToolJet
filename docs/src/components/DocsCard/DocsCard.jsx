import React, { useEffect, useState } from 'react'
import styles from './DocsCard.css'

export const DocsCard = ({ label, imgSrc, link, height = 40, width = 40, title }) => {
    const kubernetesSvg = '/img/setup/icons/kubernetes.svg'

    const imagePath = imgSrc.includes('kubernetes') ? kubernetesSvg : `/img/setup/icons/${imgSrc}.svg`

    const description = {
        "Try ToolJet": "Try out ToolJet with single docker command",
        "Choose Your ToolJet": "Important information on which version of ToolJet to use.",
        "System Requirements": "Learn about system requirements for running ToolJet",
        DigitalOcean: "Quickly deploy ToolJet using the Deploy to DigitalOcean button",
        Docker: "Deploy ToolJet on a server using docker-compose",
        Heroku: "Deploy ToolJet on Heroku using the one-click-deployment button",
        "AWS AMI": "Deploy ToolJet on AWS AMI instances",
        "AWS ECS": "Deploy ToolJet on AWS ECS instances",
        Openshift: "Deploy ToolJet on Openshift",
        Helm: "Deploy ToolJet with Helm Chart",
        Kubernetes: "Deploy ToolJet on a Kubernetes cluster",
        "Kubernetes (GKE)": "Deploy ToolJet on a GKE Kubernetes cluster",
        "Kubernetes (AKS)": "Deploy ToolJet on a AKS Kubernetes cluster",
        "Kubernetes (EKS)": "Deploy ToolJet on a EKS Kubernetes cluster",
        "Azure container apps": "Deploy ToolJet on a Azure Container Apps",
        "Google Cloud Run": "Deploy ToolJet on Cloud Run with GCloud CLI",
        "Deploying ToolJet client": "Deploy ToolJet Client on static website hosting services",
        "Environment variables": "Environment variables required by ToolJet Client and Server to start running",
        "Connecting via HTTP proxy": "Environment variables required by ToolJet to connect via HTTP proxy",
        "Deploying ToolJet on a subpath": "Steps to deploy ToolJet on a subpath rather than root of domain",
        "V2 migration guide": "Things to know before migrating to ToolJet V2",
        "Upgrading ToolJet to the LTS Version": "Guide to upgrade ToolJet to the latest LTS Version.",
        "ToolJet v3 (Beta) Migration Guide": "Breaking changes and migration guide for ToolJet v3",
        "ToolJet Cloud v3 Migration Guide": "Breaking changes and migration guide for ToolJet Cloud v3",

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

