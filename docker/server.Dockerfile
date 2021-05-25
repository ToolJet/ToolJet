FROM ruby:2.7.3-buster

RUN apt update && apt install -y \
  build-essential  \
  postgresql

RUN mkdir -p /app
WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN gem install bundler && RAILS_ENV=production bundle install --jobs 20 --retry 5

ENV RAILS_ENV=production

COPY . ./
