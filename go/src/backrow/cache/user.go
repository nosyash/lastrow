package cache

func (cache *Cache) addNewUser(uuid string) {

	userProfile, _ := cache.db.GetUserProfile(uuid)

	cache.users[uuid] = &User{
		Name:  userProfile.Name,
		Color: userProfile.Color,
		Image: userProfile.Image,
		Guest: false,
		ID:    getRandomID(),
	}
}

func (cache *Cache) addNewGuest(user *User) {
	cache.users[user.UUID] = user
}

func (cache *Cache) removeUser(uuid string) {
	delete(cache.users, uuid)
}

func (cache *Cache) GetUser(uuid string) *User {
	return cache.users[uuid]

	//userProfile, _ := cache.db.GetUserProfile(uuid)
	//return &User{
	//Name:  userProfile.Name,
	//Color: userProfile.Color,
	//Image: userProfile.Image,
	//}
}

func (cache *Cache) GetAllUsers() []*User {

	var users []*User

	for _, user := range cache.users {
		users = append(users, &User{
			Name:  user.Name,
			Color: user.Color,
			Image: user.Image,
			ID:    user.ID,
			Guest: user.Guest,
		})
	}

	return users
}
