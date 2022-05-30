import React from 'react'
import styles from './DocsCard.css'

export const DocsCard = ({label, imgSrc, link, height=40, width=40}) => {

  const kubernetesSvg = '/img/setup/icons/kubernetes.svg'

  const imagePath = imgSrc.includes('kubernetes') ? kubernetesSvg : `/img/setup/icons/${imgSrc}.svg`

  return (
    <a href={link} className="card">
      <div className="card-body">
        <div  className="card-icon">
          <img src={imagePath} height={height} width={width} />
        </div>
        <div className="card-info">
          <h3>{label}</h3>
        </div>
      </div>
    </a>
  )
}

