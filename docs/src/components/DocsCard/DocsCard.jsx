import React, {useEffect, useState} from 'react'
import styles from './DocsCard.css'

export const DocsCard = ({label, imgSrc, link, height=40, width=40,title}) => {
  console.log(title);
  const kubernetesSvg = '/img/setup/icons/kubernetes.svg'

  const imagePath = imgSrc.includes('kubernetes') ? kubernetesSvg : `/img/setup/icons/${imgSrc}.svg`

  const description = {
    Docker: "Follow the steps below to deploy ToolJet on a server using docker-compose. This setup will deploy both ToolJet server and ToolJet client.",
    Heroku: "Follow the steps below to deploy ToolJet on Heroku:",
    "AWS EC2": "You should setup a PostgreSQL database manually to be used by the ToolJet server.",
    Kubernetes :"You should setup a PostgreSQL database manually to be used by ToolJet.",
    "Kubernetes (GKE)":"You should setup a PostgreSQL database manually to be used by ToolJet.",
    "Kubernetes (AKS)":"You should setup a PostgreSQL database manually to be used by ToolJet.",
    "Google Cloud Run":"You should setup a PostgreSQL database manually to be used by ToolJet.",
    "Deploying ToolJet client":"ToolJet client is a standalone application and can be deployed on static website hosting services such as Netlify, Firebase, S3/Cloudfront, etc.",
    "Environment variables":"Both the ToolJet server and client requires some environment variables to start running."
  }

  return (
    
    <a href={link} className="card" style={{textDecoration:"none", color: "inherit"}}>
      <div className="card-body">
          <div  className="card-icon">
            <img src={imagePath} width="100%" />
          </div>
          <div className="card-info">
              <h3 style={{margin:"0", paddingBottom:"0.5rem"}}>{label}</h3>
              <p>
                {description[label].slice(0,50)+"..."}
              </p>
          </div>
        </div>
    </a>
  )
}

