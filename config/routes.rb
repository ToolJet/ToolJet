Rails.application.routes.draw do

  resources :apps, only: [:create, :show, :update]
  resources :data_sources, only: [:create, :index]
  resources :data_queries, only: [:create]

  post 'authenticate', to: 'authentication#authenticate'
end
