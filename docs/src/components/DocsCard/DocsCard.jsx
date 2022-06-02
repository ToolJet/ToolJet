import React, {useEffect, useState} from 'react'
import styles from './DocsCard.css'

export const DocsCard = ({label, imgSrc, link, height=40, width=40,title}) => {
  console.log(title);
  const kubernetesSvg = '/img/setup/icons/kubernetes.svg'

  const imagePath = imgSrc.includes('kubernetes') ? kubernetesSvg : `/img/setup/icons/${imgSrc}.svg`

  const description = {
    Docker: "You should setup a PostgreSQL database manually to be used by the ToolJet server.",
    Heroku: "You should setup a PostgreSQL database manually to be used by the ToolJet server.",
    "AWS EC2": "You should setup a PostgreSQL database manually to be used by the ToolJet server.",
    Kubernetes :"You should setup a PostgreSQL database manually to be used by ToolJet.",
    "Kubernetes (GKE)":"You should setup a PostgreSQL database manually to be used by ToolJet.",
    "Kubernetes (AKS)":"You should setup a PostgreSQL database manually to be used by ToolJet.",
    "Google Cloud Run":"You should setup a PostgreSQL database manually to be used by ToolJet.",
    "Deploying ToolJet client":"You should setup a PostgreSQL database manually to be used by the ToolJet server.",
    "Environment variables":"You should setup a PostgreSQL database manually to be used by the ToolJet server."
  }

  return (
    
    <a href={link} className="card" style={{textDecoration:"none", color: "inherit"}}>
      <div className="card-body">
          <div  className="card-icon">
            <img className='img' src={imagePath} width="100%" />
          </div>
          <div className="card-info">
              <h3 style={{margin:"0", paddingBottom:"0.5rem"}}>{label}</h3>
              <p>
                {description[label]}
              </p>
          </div>
        </div>
    </a>
  )
}

