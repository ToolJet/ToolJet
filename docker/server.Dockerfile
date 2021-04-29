FROM ruby:2.7.2-alpine

# RUN apt update && apt install -y \
#   build-essential \
#   postgresql

RUN apk update \
  && apk add \
    openssl \
    tar \
    build-base \
    tzdata \
    postgresql-dev \
    postgresql-client \
    mysql\
    mysql-client \
    mysql-dev  \
  && mkdir -p /var/app \
  && gem install bundler

RUN mkdir -p /app
WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN gem install bundler && RAILS_ENV=production bundle install --jobs 20 --retry 5

ENV RAILS_ENV=production

COPY . ./
